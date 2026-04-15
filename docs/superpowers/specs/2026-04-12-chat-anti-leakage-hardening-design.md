# Chat Anti-Leakage Hardening — Design

Date: 2026-04-12
Status: Approved for planning

## Problem

Railmatch chat is the deal-flow surface between shippers and wagon owners. Users routinely try to leak contact info (email, phone, telegram) to take deals off-platform before the match is paid. Current detection lives only in `src/security.js` and runs in the browser, which means:

1. A modified client (or direct REST call to `/messages`) bypasses every check.
2. The detector is whitelist-naive: latin homoglyphs (`a@b.c`, `t.me/`) and creative spacing slip through.
3. Cross-message sequencing (one digit per message, then assembled) is invisible.
4. Admin has no record of attempts — there is no aggregation, no per-user history, no Notion visibility.

This spec hardens detection server-side, locks down direct DB writes, and pipes violations into Notion for triage.

Out of scope: image OCR (chat has no image attachments), voice messages, file uploads.

## Architecture Overview

```
Client (ChatWindow.jsx)
   │
   │  POST  (no direct INSERT into messages anymore)
   ▼
Edge Function: send-chat-message
   ├── auth: verify JWT, resolve sender profile
   ├── load match, verify sender is participant
   ├── kind: "user" → run detectors
   │      ├── latin whitelist normalizer
   │      ├── fuzzy email / phone / @handle / t.me
   │      └── cross-party sequence (recent N msgs in same match)
   ├── detected? → INSERT chat_violations (service_role), return 422
   ├── clean?    → INSERT messages (service_role), return 200
   └── kind: "system" → INSERT messages with system flag (admin only)
   ▲
   │
RLS on messages: INSERT denied for everyone except service_role
SELECT unchanged (participants of match)

Cron edge function: notion-sync-violations  (every 5 min)
   ├── SELECT chat_violations WHERE notion_synced_at IS NULL
   ├── for each row:
   │     POST page → Notion DB "Violations"
   │     PATCH page → Notion DB "Users" (increment counter, last_at)
   │     UPDATE chat_violations SET notion_synced_at = now()
   └── rate limit 3 req/sec
```

## Section 1 — Server-side enforcement (agreed)

New edge function `supabase/functions/send-chat-message/index.ts`.

Request body:
```json
{ "match_id": "uuid", "text": "string", "kind": "user" | "system" }
```

Flow:
1. Verify JWT via Supabase auth helper, resolve `sender_id`.
2. `kind: "system"` is allowed only when sender's profile has `role = 'admin'`. Reject otherwise.
3. Load match row by `match_id`. Reject if sender is not the shipper or owner of the match.
4. For `kind: "user"` run the detector pipeline (sections 2–4). On hit, do **not** insert into `messages`. Insert a row into `chat_violations` and return HTTP 422 with `{ blocked: true, detector, hint }`. Client shows a toast.
5. On clean, INSERT into `messages` using the service-role client.

The function uses two clients: an anon client bound to the user's JWT for auth resolution, and a service-role client for writes (mirrors the pattern from the recent `verifyOtp` fix in `e099da5`).

`ChatWindow.jsx` stops calling `supabase.from('messages').insert(...)` directly and instead calls `supabase.functions.invoke('send-chat-message', ...)`. Optimistic UI stays; on 422 the optimistic message is replaced with a blocked-style bubble and the toast.

### RLS lock on `messages`

Migration:
```sql
DROP POLICY IF EXISTS "messages_insert_participants" ON messages;
CREATE POLICY "messages_insert_service_only"
  ON messages FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```
SELECT policy unchanged. This guarantees that any modified client or direct REST call cannot bypass the edge function.

## Section 2 — Latin whitelist normalizer (agreed)

Before running pattern detectors the text is normalized:

1. NFKC unicode normalization.
2. Cyrillic→latin homoglyph fold for the closed set `а→a, е→e, о→o, р→p, с→c, у→u, х→x, к→k, в→b, н→h, м→m, т→t` (case-insensitive).
3. Strip zero-width characters (`\u200b–\u200f`, `\u2060`, `\ufeff`).
4. Collapse runs of whitespace and punctuation between alphanumerics: `t . m e / foo` → `t.me/foo`, `a @ b . c` → `a@b.c`.
5. Lowercase.

The normalizer lives in a shared module reused by the edge function and (read-only mirror) by `src/security.js` for instant client UX feedback. Source of truth is the server copy.

## Section 3 — Fuzzy email / phone / handle (agreed)

Run on the normalized string:

- **Email:** `[\w.+-]+@[\w-]+\.[\w.-]+` plus a looser `[\w]+\s*(at|собака|@)\s*[\w]+\s*(dot|точка|\.)\s*[a-z]{2,}` for the spelled-out form.
- **Phone:** any sequence containing ≥9 digits after stripping non-digits, with optional `+`. Reject obvious non-phones (years, prices) by requiring at least one digit-cluster boundary or a phone-shaped prefix (`+7`, `8`, `7`).
- **Telegram handle:** `@[a-z0-9_]{4,}`, plus `t\.me/[a-z0-9_]+`, plus `telegram\s*[:\-]?\s*@?[a-z0-9_]{4,}`.
- **WhatsApp / generic messenger keywords:** `whats?app|вотсап|вацап|wa\.me`.

Each rule returns a detector id (`email`, `email_spelled`, `phone`, `tg_handle`, `tg_link`, `wa`). First match wins; the rest still run only to enrich severity.

## Section 4 — Cross-party sequence detector (agreed)

The single-message detectors miss "0", "9", "1", "2"… spread across messages. The edge function additionally:

1. Loads the last 8 messages in the same match (any sender) ordered by `created_at`.
2. Concatenates their normalized text plus the incoming candidate, separated by spaces.
3. Re-runs the phone and email detectors on the joined string.
4. If the joined string matches but the new message alone does not, attribute the violation to the **current sender** (they completed the sequence) and tag detector `phone_sequence` / `email_sequence`.

Window of 8 messages keeps the false-positive rate manageable while catching the common "drip a digit per message" pattern. Tunable constant `SEQUENCE_WINDOW = 8` lives at the top of the edge function.

## Section 5 — Notion sync of violations

### 5.1 Database table `chat_violations`

Migration:
```sql
CREATE TABLE chat_violations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id        uuid NOT NULL REFERENCES matches(id)  ON DELETE CASCADE,
  detector        text NOT NULL,         -- email | phone | tg_handle | tg_link | wa | phone_sequence | email_sequence
  severity        text NOT NULL DEFAULT 'medium',  -- low | medium | high
  snippet         text NOT NULL,         -- ±20 chars around match, normalized
  created_at      timestamptz NOT NULL DEFAULT now(),
  notion_synced_at timestamptz
);
CREATE INDEX chat_violations_unsynced ON chat_violations (created_at)
  WHERE notion_synced_at IS NULL;
CREATE INDEX chat_violations_user ON chat_violations (user_id, created_at DESC);

ALTER TABLE chat_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_violations_admin_read"
  ON chat_violations FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
-- INSERT is service_role only (no policy = denied for anon/authenticated).
```

The snippet is built by the edge function: take the matched substring, expand by 20 chars on each side, clip to message bounds, replace newlines with spaces. For sequence detectors the snippet is the joined assembled value (e.g. `+79991234567`) — there is no single source span to quote.

Severity rules:
- `high`: `email`, `phone`, `phone_sequence`, `email_sequence`
- `medium`: `tg_handle`, `tg_link`, `wa`
- `low`: reserved for future heuristics

### 5.2 Notion DB `Violations`

A new Notion database (env `NOTION_VIOLATIONS_DB_ID`) with properties:

| Property        | Type         | Source                              |
|-----------------|--------------|-------------------------------------|
| Title           | title        | `${roleLabel} — ${detector}`        |
| User Email      | email        | `profiles.email`                    |
| User Name       | rich_text    | `profiles.name`                     |
| Role            | select       | shipper / owner / admin             |
| Match           | rich_text    | `match_id` (truncated)              |
| Detector        | select       | detector id                         |
| Severity        | select       | low / medium / high                 |
| Snippet         | rich_text    | `chat_violations.snippet`           |
| Created         | date         | `chat_violations.created_at`        |
| Supabase ID     | rich_text    | `chat_violations.id` (idempotency)  |

Idempotency: before INSERT the sync function queries the DB filtered by `Supabase ID` to skip rows that were already pushed (covers retries after a partial run).

### 5.3 Notion DB `Users` — aggregate columns

Add three properties to the existing `Users` Notion DB (created by `notion-sync-users`):

| Property             | Type   |
|----------------------|--------|
| Violations Count     | number |
| Last Violation At    | date   |
| Last Violation Type  | select |

These are recomputed per profile during the sync run by issuing a `count + max(created_at) + last detector` query against `chat_violations` for that user, then PATCHing the user's Notion page (lookup by Email, same as `notion-sync-users`).

### 5.4 Edge function `notion-sync-violations`

New file `supabase/functions/notion-sync-violations/index.ts`. Mirrors the structure of `notion-sync-users`:

1. Read env: `NOTION_TOKEN`, `NOTION_VIOLATIONS_DB_ID`, `NOTION_USERS_DB_ID`.
2. `SELECT chat_violations.*, profiles.email, profiles.name, profiles.role
     FROM chat_violations JOIN profiles ON profiles.id = chat_violations.user_id
     WHERE notion_synced_at IS NULL
     ORDER BY created_at ASC
     LIMIT 200;`
3. For each row:
   - Lookup existing Violations page by `Supabase ID` (skip if found, but still update `notion_synced_at`).
   - POST new page to `NOTION_VIOLATIONS_DB_ID`.
   - Recompute aggregates for this user and PATCH their page in `NOTION_USERS_DB_ID` (lookup by email, cache emails in-run to avoid re-querying).
   - `UPDATE chat_violations SET notion_synced_at = now() WHERE id = $1`.
   - Sleep 350 ms every request to stay under Notion's 3 req/s.
4. Return JSON `{ synced, skipped, errors }`.

Failure handling: any per-row error is caught, logged with the violation id, and the row is left unsynced so the next run retries it. The function never throws — it always returns 200 with counts so the cron does not flap.

### 5.5 Scheduling

Add a Supabase scheduled trigger (pg_cron in the project's `supabase/migrations`) calling the edge function every 5 minutes:

```sql
SELECT cron.schedule(
  'notion-sync-violations',
  '*/5 * * * *',
  $$ SELECT net.http_post(
       url := 'https://<project>.functions.supabase.co/notion-sync-violations',
       headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
     ); $$
);
```

The exact URL/secret wiring follows the same pattern the project already uses for `notion-sync-users` (manually triggered today; this spec also moves that one onto the same cron pattern only if the user wants — otherwise unchanged).

### 5.6 Admin UI hook (minimal)

`components/AdminPanel.jsx` already lists users. Add a small badge next to each user showing `violations_count` from a new view `profiles_with_violation_counts` (cheap left join + group by). Clicking the badge opens a modal listing the user's `chat_violations` rows (admin RLS already allows SELECT). No new pages, no new routes — just a badge and a modal so the data is reachable from inside the app even when Notion is down.

## Data Flow Summary

1. User types message → ChatWindow optimistic render.
2. `supabase.functions.invoke('send-chat-message', { match_id, text, kind: 'user' })`.
3. Edge function normalizes, runs detectors, runs sequence detector against last 8 messages.
4a. Clean: insert into `messages`, return `{ ok: true, message }`. Realtime delivers to other party.
4b. Dirty: insert into `chat_violations`, return `422 { blocked: true, detector }`. Client replaces optimistic bubble with a blocked indicator and shows a toast.
5. Cron fires `notion-sync-violations` every 5 min. Unsynced rows pushed to Violations DB; user aggregates patched in Users DB.
6. Admin sees the badge in AdminPanel and/or browses the Violations DB in Notion.

## Error Handling

| Failure                                | Behavior                                                                 |
|----------------------------------------|--------------------------------------------------------------------------|
| Edge function 5xx                      | Client shows generic "не удалось отправить", retries on user action      |
| Edge function 422 (blocked)            | Client shows specific anti-leak toast, no retry                          |
| `chat_violations` insert fails         | Edge function still returns 422 to client; logs error; user is blocked anyway |
| Notion sync 429 / 5xx                  | Row stays unsynced, next cron retries; per-row try/catch                 |
| Notion `Users` page lookup miss        | Sync still creates the Violations page; aggregate update is skipped with a warning |
| `messages` direct INSERT attempt       | RLS denies. No fallback path.                                            |

## Testing Strategy

- **Unit (`tests/security.test.js`)** — normalizer fixtures, detector fixtures (latin homoglyphs, spelled-out emails, sequenced phones), boundary cases (years, prices, legitimate "@" mentions).
- **Edge function integration** — Deno test that hits the function with a fake JWT against a local Supabase, asserts `chat_violations` row shape and that `messages` row is **not** created on dirty input.
- **RLS test** — direct REST INSERT into `messages` with an authenticated user JWT must return 401/403.
- **Notion sync** — fixture `chat_violations` row + mocked Notion fetch; assert page payload, idempotency on second run, aggregate PATCH call shape.
- **Manual smoke** — paste each detector class into chat in dev; verify toast, row in `chat_violations`, row in Notion after cron.

## Migration / Rollout Order

1. Ship `chat_violations` migration + indexes + RLS.
2. Ship `send-chat-message` edge function (still allows direct INSERT for now).
3. Update `ChatWindow.jsx` to call the edge function, deploy.
4. Once metrics confirm 100% of inserts go via the function, ship the RLS lock-down migration.
5. Create Notion `Violations` DB and aggregate columns on `Users` DB; set env vars.
6. Ship `notion-sync-violations` edge function and pg_cron schedule.
7. Add AdminPanel badge.

Steps 1–4 are the security-critical path. Steps 5–7 are observability and can land in a follow-up PR if needed, but should be in the same release week so admins are not blind.

## Open Questions

None — all four prior sections and section 5 are agreed. Implementation plan can proceed.
