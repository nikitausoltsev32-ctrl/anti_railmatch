# Chat Anti-Leakage Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move chat anti-leakage detection from the browser to the Supabase edge, lock direct DB writes via RLS, and pipe violations into Notion for admin triage.

**Architecture:** A new edge function `send-chat-message` runs detectors (latin-fold normalizer, fuzzy email/phone/handle, cross-party sequence) and is the only writer to the `messages` table after RLS lock-down. Blocked attempts land in a new `chat_violations` table; a cron'd `notion-sync-violations` function pushes them to a Notion `Violations` DB and updates aggregate counters on the existing `Users` DB.

**Tech Stack:** Supabase (Postgres + Edge Functions, Deno), React/Vite client, Notion API, pg_cron, Vitest for JS unit tests, `deno test` for edge functions.

**Spec:** `docs/superpowers/specs/2026-04-12-chat-anti-leakage-hardening-design.md`

---

## File Structure

**Create:**
- `supabase/functions/_shared/anti-leak.ts` — normalizer + detectors (single source of truth, imported by both edge functions and mirrored to client)
- `supabase/functions/_shared/anti-leak.test.ts` — Deno unit tests for the shared module
- `supabase/functions/send-chat-message/index.ts` — chat write endpoint
- `supabase/functions/send-chat-message/index.test.ts` — Deno integration tests
- `supabase/functions/notion-sync-violations/index.ts` — cron sync
- `supabase/migrations/20260412010000_chat_violations.sql`
- `supabase/migrations/20260412010100_messages_rls_lockdown.sql`
- `supabase/migrations/20260412010200_notion_sync_violations_cron.sql`
- `src/anti-leak.js` — thin client mirror (re-exports normalize+detect for instant UX feedback only)
- `tests/anti-leak.test.js` — Vitest for client mirror parity

**Modify:**
- `components/ChatWindow.jsx` — replace direct `messages` insert with `functions.invoke('send-chat-message')`, add blocked-bubble UI
- `components/AdminPanel.jsx` — add violations badge + modal
- `src/security.js` — re-export from `src/anti-leak.js` to keep call sites working (or delete in favor of direct import — Task 12)
- `package.json` — add `vitest` devDep + `test` script

---

## Task 1: Vitest scaffold

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`
- Create: `tests/.gitkeep`

- [ ] **Step 1: Add vitest devDep and script**

Edit `package.json`, add to `devDependencies`:
```json
"vitest": "^1.6.0"
```
Add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.js`:
```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
```

- [ ] **Step 3: Install and verify**

Run: `npm install`
Run: `npm test`
Expected: "No test files found" exit 0 (or 1 with that message — both fine).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json vitest.config.js tests/.gitkeep
git commit -m "chore(test): add vitest scaffold"
```

---

## Task 2: Shared anti-leak module — normalizer (TDD)

**Files:**
- Create: `supabase/functions/_shared/anti-leak.ts`
- Create: `supabase/functions/_shared/anti-leak.test.ts`

- [ ] **Step 1: Write failing normalizer tests**

Create `supabase/functions/_shared/anti-leak.test.ts`:
```ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalize } from "./anti-leak.ts";

Deno.test("normalize: NFKC + lowercase", () => {
  assertEquals(normalize("HELLO"), "hello");
});

Deno.test("normalize: cyrillic homoglyph fold", () => {
  // 'а','е','о','р','с' here are cyrillic
  assertEquals(normalize("ареса"), "apeca");
});

Deno.test("normalize: zero-width strip", () => {
  assertEquals(normalize("a\u200bb\u200cc\ufeff"), "abc");
});

Deno.test("normalize: collapse spaces inside emails/links", () => {
  assertEquals(normalize("a @ b . c"), "a@b.c");
  assertEquals(normalize("t . m e / foo"), "t.me/foo");
});

Deno.test("normalize: preserves regular spaces between words", () => {
  assertEquals(normalize("hello world"), "hello world");
});
```

- [ ] **Step 2: Run tests, expect FAIL**

Run: `deno test supabase/functions/_shared/anti-leak.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement normalizer**

Create `supabase/functions/_shared/anti-leak.ts`:
```ts
const HOMOGLYPHS: Record<string, string> = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y",
  "х": "x", "к": "k", "в": "b", "н": "h", "м": "m", "т": "t",
  "А": "a", "Е": "e", "О": "o", "Р": "p", "С": "c", "У": "y",
  "Х": "x", "К": "k", "В": "b", "Н": "h", "М": "m", "Т": "t",
};

const ZERO_WIDTH = /[\u200b-\u200f\u2060\ufeff]/g;

export function normalize(input: string): string {
  if (!input) return "";
  let s = input.normalize("NFKC");
  s = s.replace(ZERO_WIDTH, "");
  s = s.replace(/[а-яА-Я]/g, (c) => HOMOGLYPHS[c] ?? c);
  s = s.toLowerCase();
  // Collapse punctuation/spaces between alphanumerics for "a @ b . c" → "a@b.c"
  // Only collapse around the "glue" chars . @ /
  s = s.replace(/([a-z0-9])\s*([.@\/])\s*([a-z0-9])/g, "$1$2$3");
  // Re-run twice to catch chains like "a @ b . c"
  s = s.replace(/([a-z0-9])\s*([.@\/])\s*([a-z0-9])/g, "$1$2$3");
  return s;
}
```

- [ ] **Step 4: Run tests, expect PASS**

Run: `deno test supabase/functions/_shared/anti-leak.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/anti-leak.ts supabase/functions/_shared/anti-leak.test.ts
git commit -m "feat(anti-leak): add normalizer with homoglyph fold"
```

---

## Task 3: Shared anti-leak module — detectors (TDD)

**Files:**
- Modify: `supabase/functions/_shared/anti-leak.ts`
- Modify: `supabase/functions/_shared/anti-leak.test.ts`

- [ ] **Step 1: Append failing detector tests**

Append to `supabase/functions/_shared/anti-leak.test.ts`:
```ts
import { detect } from "./anti-leak.ts";

Deno.test("detect: plain email", () => {
  const r = detect("write me at john.doe@example.com please");
  assertEquals(r?.detector, "email");
});

Deno.test("detect: spelled-out email", () => {
  const r = detect("john at example dot com");
  assertEquals(r?.detector, "email_spelled");
});

Deno.test("detect: phone with country code", () => {
  const r = detect("звони +7 999 123 45 67");
  assertEquals(r?.detector, "phone");
});

Deno.test("detect: telegram handle", () => {
  const r = detect("пиши в @ivan_petrov_77");
  assertEquals(r?.detector, "tg_handle");
});

Deno.test("detect: t.me link", () => {
  const r = detect("t.me/ivan_petrov");
  assertEquals(r?.detector, "tg_link");
});

Deno.test("detect: whatsapp keyword", () => {
  const r = detect("есть вотсап?");
  assertEquals(r?.detector, "wa");
});

Deno.test("detect: clean text returns null", () => {
  assertEquals(detect("сколько вагонов в марте?"), null);
});

Deno.test("detect: snippet bounds around match", () => {
  const r = detect("hello my email is bob@bob.io thanks");
  assertEquals(r?.snippet.includes("bob@bob.io"), true);
});

Deno.test("detect: cyrillic homoglyph email", () => {
  // mix of cyrillic letters
  const r = detect("ивaн@мaил.com"); // 'a' cyrillic
  assertEquals(r?.detector, "email");
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `deno test supabase/functions/_shared/anti-leak.test.ts`
Expected: FAIL (`detect` not exported).

- [ ] **Step 3: Implement detectors**

Append to `supabase/functions/_shared/anti-leak.ts`:
```ts
export type DetectorId =
  | "email" | "email_spelled"
  | "phone"
  | "tg_handle" | "tg_link"
  | "wa"
  | "phone_sequence" | "email_sequence";

export interface Detection {
  detector: DetectorId;
  severity: "low" | "medium" | "high";
  snippet: string;
}

const SEVERITY: Record<DetectorId, "low" | "medium" | "high"> = {
  email: "high",
  email_spelled: "high",
  phone: "high",
  phone_sequence: "high",
  email_sequence: "high",
  tg_handle: "medium",
  tg_link: "medium",
  wa: "medium",
};

const RULES: { id: DetectorId; re: RegExp }[] = [
  { id: "email",         re: /[\w.+-]+@[\w-]+\.[\w.-]+/ },
  { id: "email_spelled", re: /[a-z0-9_]+\s*(?:at|собака)\s*[a-z0-9_]+\s*(?:dot|точка)\s*[a-z]{2,}/ },
  { id: "tg_link",       re: /t\.me\/[a-z0-9_]+/ },
  { id: "tg_handle",     re: /(?:^|[^a-z0-9_])@[a-z0-9_]{4,}/ },
  { id: "wa",            re: /whats?app|вотсап|вацап|wa\.me/ },
];

function snippetAround(src: string, match: RegExpMatchArray, pad = 20): string {
  const start = Math.max(0, (match.index ?? 0) - pad);
  const end = Math.min(src.length, (match.index ?? 0) + match[0].length + pad);
  return src.slice(start, end).replace(/\s+/g, " ").trim();
}

function detectPhone(s: string): Detection | null {
  // Strip non-digits but remember positions for snippet
  const digitsOnly = s.replace(/[^\d+]/g, "");
  // Need a phone-shaped run: optional +, then 9+ digits
  const m = digitsOnly.match(/\+?\d{9,}/);
  if (!m) return null;
  // Find an approximate snippet from the original by locating any digit cluster
  const origMatch = s.match(/(?:\+?\d[\d\s().\-]{8,}\d)/);
  const snippet = origMatch ? snippetAround(s, origMatch) : m[0];
  return { detector: "phone", severity: "high", snippet };
}

export function detect(input: string): Detection | null {
  const s = normalize(input);
  for (const rule of RULES) {
    const m = s.match(rule.re);
    if (m) {
      return {
        detector: rule.id,
        severity: SEVERITY[rule.id],
        snippet: snippetAround(s, m),
      };
    }
  }
  return detectPhone(s);
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `deno test supabase/functions/_shared/anti-leak.test.ts`
Expected: all 14 passed.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/anti-leak.ts supabase/functions/_shared/anti-leak.test.ts
git commit -m "feat(anti-leak): add fuzzy email/phone/handle detectors"
```

---

## Task 4: Cross-party sequence detector (TDD)

**Files:**
- Modify: `supabase/functions/_shared/anti-leak.ts`
- Modify: `supabase/functions/_shared/anti-leak.test.ts`

- [ ] **Step 1: Append failing sequence tests**

Append to test file:
```ts
import { detectSequence } from "./anti-leak.ts";

Deno.test("detectSequence: assembled phone across messages", () => {
  const history = ["мой телефон", "+7", "999", "123", "45"];
  const r = detectSequence("67", history);
  assertEquals(r?.detector, "phone_sequence");
});

Deno.test("detectSequence: clean history returns null", () => {
  const r = detectSequence("ок согласен", ["когда поедем", "в среду"]);
  assertEquals(r, null);
});

Deno.test("detectSequence: ignores when current message alone is dirty", () => {
  // single-message detect already catches this, sequence should not double-fire
  const r = detectSequence("+79991234567", ["привет"]);
  assertEquals(r, null);
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `deno test supabase/functions/_shared/anti-leak.test.ts`
Expected: FAIL (`detectSequence` not exported).

- [ ] **Step 3: Implement**

Append to `supabase/functions/_shared/anti-leak.ts`:
```ts
export const SEQUENCE_WINDOW = 8;

export function detectSequence(current: string, history: string[]): Detection | null {
  // Skip if current message alone already matches — single detector handles it
  if (detect(current)) return null;
  const joined = [...history.slice(-SEQUENCE_WINDOW), current]
    .map((m) => normalize(m))
    .join(" ");
  // Re-run phone detector on joined; it's the common attack
  const phoneHit = detectPhone(joined);
  if (phoneHit) {
    return { detector: "phone_sequence", severity: "high", snippet: phoneHit.snippet };
  }
  // And email rule
  const emailHit = joined.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailHit) {
    return {
      detector: "email_sequence",
      severity: "high",
      snippet: snippetAround(joined, emailHit),
    };
  }
  return null;
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `deno test supabase/functions/_shared/anti-leak.test.ts`
Expected: 17 passed.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/anti-leak.ts supabase/functions/_shared/anti-leak.test.ts
git commit -m "feat(anti-leak): add cross-party sequence detector"
```

---

## Task 5: `chat_violations` migration

**Files:**
- Create: `supabase/migrations/20260412010000_chat_violations.sql`

- [ ] **Step 1: Write migration**

Create file:
```sql
CREATE TABLE chat_violations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id        uuid NOT NULL REFERENCES matches(id)  ON DELETE CASCADE,
  detector        text NOT NULL,
  severity        text NOT NULL DEFAULT 'medium',
  snippet         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  notion_synced_at timestamptz
);

CREATE INDEX chat_violations_unsynced
  ON chat_violations (created_at)
  WHERE notion_synced_at IS NULL;

CREATE INDEX chat_violations_user
  ON chat_violations (user_id, created_at DESC);

ALTER TABLE chat_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_violations_admin_read"
  ON chat_violations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));
```

- [ ] **Step 2: Apply locally**

Run: `npx supabase db push` (or `supabase migration up` if using the CLI directly)
Expected: migration applied without error.

- [ ] **Step 3: Verify table**

Run: `npx supabase db execute "select column_name from information_schema.columns where table_name='chat_violations' order by ordinal_position;"`
Expected: 8 columns matching the spec.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260412010000_chat_violations.sql
git commit -m "feat(db): add chat_violations table"
```

---

## Task 6: `send-chat-message` edge function — happy path (TDD)

**Files:**
- Create: `supabase/functions/send-chat-message/index.ts`
- Create: `supabase/functions/send-chat-message/index.test.ts`

- [ ] **Step 1: Write failing happy-path test**

Create `supabase/functions/send-chat-message/index.test.ts`:
```ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleRequest } from "./index.ts";

const fakeDeps = (overrides: Partial<any> = {}) => ({
  resolveSender: async () => ({ id: "user-1", role: "shipper" }),
  loadMatch: async () => ({ id: "match-1", shipper_id: "user-1", owner_id: "user-2" }),
  loadHistory: async () => [],
  insertMessage: async (row: any) => ({ ...row, id: "msg-1" }),
  insertViolation: async () => { throw new Error("should not be called"); },
  ...overrides,
});

Deno.test("happy path: clean user message → 200 + message returned", async () => {
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      headers: { Authorization: "Bearer fake" },
      body: JSON.stringify({ match_id: "match-1", text: "когда грузим?", kind: "user" }),
    }),
    fakeDeps(),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.ok, true);
  assertEquals(body.message.id, "msg-1");
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `deno test supabase/functions/send-chat-message/index.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement minimal handler**

Create `supabase/functions/send-chat-message/index.ts`:
```ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { detect, detectSequence } from "../_shared/anti-leak.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Deps {
  resolveSender: (req: Request) => Promise<{ id: string; role: string } | null>;
  loadMatch: (id: string) => Promise<{ id: string; shipper_id: string; owner_id: string } | null>;
  loadHistory: (matchId: string) => Promise<string[]>;
  insertMessage: (row: { match_id: string; sender_id: string; text: string; kind: string }) => Promise<any>;
  insertViolation: (row: { user_id: string; match_id: string; detector: string; severity: string; snippet: string }) => Promise<void>;
}

export async function handleRequest(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const { match_id, text, kind } = body ?? {};
  if (!match_id || typeof text !== "string" || (kind !== "user" && kind !== "system")) {
    return json({ error: "bad payload" }, 400);
  }

  const sender = await deps.resolveSender(req);
  if (!sender) return json({ error: "unauth" }, 401);
  if (kind === "system" && sender.role !== "admin") return json({ error: "forbidden" }, 403);

  const match = await deps.loadMatch(match_id);
  if (!match) return json({ error: "no match" }, 404);
  if (sender.role !== "admin" && sender.id !== match.shipper_id && sender.id !== match.owner_id) {
    return json({ error: "not participant" }, 403);
  }

  if (kind === "user") {
    const single = detect(text);
    let hit = single;
    if (!hit) {
      const history = await deps.loadHistory(match_id);
      hit = detectSequence(text, history);
    }
    if (hit) {
      await deps.insertViolation({
        user_id: sender.id,
        match_id,
        detector: hit.detector,
        severity: hit.severity,
        snippet: hit.snippet,
      });
      return json({ blocked: true, detector: hit.detector }, 422);
    }
  }

  const message = await deps.insertMessage({ match_id, sender_id: sender.id, text, kind });
  return json({ ok: true, message }, 200);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Production wiring
serve(async (req) => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const svc = createClient(url, service);

  return handleRequest(req, {
    resolveSender: async () => {
      const { data } = await userClient.auth.getUser();
      if (!data.user) return null;
      const { data: prof } = await svc.from("profiles").select("id, role").eq("id", data.user.id).single();
      return prof ?? null;
    },
    loadMatch: async (id) => {
      const { data } = await svc.from("matches").select("id, shipper_id, owner_id").eq("id", id).single();
      return data;
    },
    loadHistory: async (matchId) => {
      const { data } = await svc
        .from("messages")
        .select("text")
        .eq("match_id", matchId)
        .order("created_at", { ascending: false })
        .limit(8);
      return (data ?? []).reverse().map((r: any) => r.text);
    },
    insertMessage: async (row) => {
      const { data } = await svc.from("messages").insert(row).select().single();
      return data;
    },
    insertViolation: async (row) => {
      await svc.from("chat_violations").insert(row);
    },
  });
});
```

- [ ] **Step 4: Run, expect PASS**

Run: `deno test supabase/functions/send-chat-message/index.test.ts --allow-net --allow-env`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/send-chat-message/
git commit -m "feat(chat): add send-chat-message edge function happy path"
```

---

## Task 7: `send-chat-message` — block & auth tests

**Files:**
- Modify: `supabase/functions/send-chat-message/index.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
Deno.test("blocked: detector hit → 422 + violation inserted", async () => {
  let violationRow: any = null;
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      headers: { Authorization: "Bearer fake" },
      body: JSON.stringify({ match_id: "match-1", text: "звони +79991234567", kind: "user" }),
    }),
    fakeDeps({
      insertViolation: async (row: any) => { violationRow = row; },
      insertMessage: async () => { throw new Error("should not insert"); },
    }),
  );
  assertEquals(res.status, 422);
  const body = await res.json();
  assertEquals(body.blocked, true);
  assertEquals(body.detector, "phone");
  assertEquals(violationRow.user_id, "user-1");
  assertEquals(violationRow.detector, "phone");
});

Deno.test("sequence: assembled phone over history → 422", async () => {
  let violationRow: any = null;
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      headers: { Authorization: "Bearer fake" },
      body: JSON.stringify({ match_id: "match-1", text: "67", kind: "user" }),
    }),
    fakeDeps({
      loadHistory: async () => ["мой телефон", "+7", "999", "123", "45"],
      insertViolation: async (row: any) => { violationRow = row; },
      insertMessage: async () => { throw new Error("should not insert"); },
    }),
  );
  assertEquals(res.status, 422);
  assertEquals(violationRow.detector, "phone_sequence");
});

Deno.test("unauth → 401", async () => {
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ match_id: "match-1", text: "hi", kind: "user" }),
    }),
    fakeDeps({ resolveSender: async () => null }),
  );
  assertEquals(res.status, 401);
});

Deno.test("non-participant → 403", async () => {
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      headers: { Authorization: "Bearer fake" },
      body: JSON.stringify({ match_id: "match-1", text: "hi", kind: "user" }),
    }),
    fakeDeps({
      resolveSender: async () => ({ id: "stranger", role: "shipper" }),
    }),
  );
  assertEquals(res.status, 403);
});

Deno.test("kind=system from non-admin → 403", async () => {
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      headers: { Authorization: "Bearer fake" },
      body: JSON.stringify({ match_id: "match-1", text: "hi", kind: "system" }),
    }),
    fakeDeps(),
  );
  assertEquals(res.status, 403);
});

Deno.test("kind=system from admin → 200", async () => {
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      headers: { Authorization: "Bearer fake" },
      body: JSON.stringify({ match_id: "match-1", text: "system note", kind: "system" }),
    }),
    fakeDeps({
      resolveSender: async () => ({ id: "admin-1", role: "admin" }),
    }),
  );
  assertEquals(res.status, 200);
});
```

- [ ] **Step 2: Run, expect all PASS**

Run: `deno test supabase/functions/send-chat-message/index.test.ts --allow-net --allow-env`
Expected: 7 passed (existing happy path + 6 new).

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/send-chat-message/index.test.ts
git commit -m "test(chat): cover block, auth, system-kind paths"
```

---

## Task 8: Deploy edge function and switch client over

**Files:**
- Modify: `components/ChatWindow.jsx`
- Create: `src/anti-leak.js`

- [ ] **Step 1: Deploy function**

Run: `npx supabase functions deploy send-chat-message`
Expected: deploy success message.

- [ ] **Step 2: Read current ChatWindow insert**

Run: `grep -n "from('messages')" components/ChatWindow.jsx`
Note the line range that does the insert.

- [ ] **Step 3: Create client mirror module**

Create `src/anti-leak.js`:
```js
const HOMOGLYPHS = {
  "а":"a","е":"e","о":"o","р":"p","с":"c","у":"y","х":"x","к":"k","в":"b","н":"h","м":"m","т":"t",
  "А":"a","Е":"e","О":"o","Р":"p","С":"c","У":"y","Х":"x","К":"k","В":"b","Н":"h","М":"m","Т":"t",
};
const ZW = /[\u200b-\u200f\u2060\ufeff]/g;

export function normalize(input) {
  if (!input) return "";
  let s = input.normalize("NFKC").replace(ZW, "");
  s = s.replace(/[а-яА-Я]/g, (c) => HOMOGLYPHS[c] ?? c).toLowerCase();
  s = s.replace(/([a-z0-9])\s*([.@\/])\s*([a-z0-9])/g, "$1$2$3");
  s = s.replace(/([a-z0-9])\s*([.@\/])\s*([a-z0-9])/g, "$1$2$3");
  return s;
}

const RULES = [
  ["email",         /[\w.+-]+@[\w-]+\.[\w.-]+/],
  ["email_spelled", /[a-z0-9_]+\s*(?:at|собака)\s*[a-z0-9_]+\s*(?:dot|точка)\s*[a-z]{2,}/],
  ["tg_link",       /t\.me\/[a-z0-9_]+/],
  ["tg_handle",     /(?:^|[^a-z0-9_])@[a-z0-9_]{4,}/],
  ["wa",            /whats?app|вотсап|вацап|wa\.me/],
];

export function detect(input) {
  const s = normalize(input);
  for (const [id, re] of RULES) if (re.test(s)) return { detector: id };
  const digits = s.replace(/[^\d+]/g, "");
  if (/\+?\d{9,}/.test(digits)) return { detector: "phone" };
  return null;
}
```

- [ ] **Step 4: Modify ChatWindow.jsx send handler**

Replace the existing direct insert (the block found in Step 2) with:
```jsx
import { supabase } from "../src/supabaseClient";
import { detect as preDetect } from "../src/anti-leak";

// inside send handler, after building `text`:
const local = preDetect(text);
if (local) {
  setError("Сообщение содержит контактные данные. Передавайте их только после оплаты сделки.");
  return;
}

const { data, error } = await supabase.functions.invoke("send-chat-message", {
  body: { match_id: matchId, text, kind: "user" },
});

if (error || data?.blocked) {
  setError(
    data?.blocked
      ? "Сообщение заблокировано: запрещено передавать контакты в чате."
      : "Не удалось отправить сообщение."
  );
  return;
}
// success: do NOT manually insert; the function already inserted, realtime will deliver.
```
(Adapt variable names — `setError`, `matchId`, `text` — to match what's actually in `ChatWindow.jsx`. Read the file first.)

- [ ] **Step 5: Manual smoke**

Run: `npm run dev`
Open the app, log in as a shipper, open a chat, send:
- `привет когда грузим?` → expect delivery
- `звони +79991234567` → expect blocked toast
- `пиши на ivan@mail.ru` → expect blocked toast

- [ ] **Step 6: Commit**

```bash
git add src/anti-leak.js components/ChatWindow.jsx
git commit -m "feat(chat): route messages through send-chat-message edge function"
```

---

## Task 9: Lock down `messages` INSERT via RLS

**Files:**
- Create: `supabase/migrations/20260412010100_messages_rls_lockdown.sql`

- [ ] **Step 1: Verify all client send paths now go through the function**

Run: `grep -rn "from('messages').insert\|from(\"messages\").insert" src/ components/ app.jsx`
Expected: zero matches. If any remain, fix them before proceeding.

- [ ] **Step 2: Write migration**

Create file:
```sql
DROP POLICY IF EXISTS "messages_insert_participants" ON messages;
DROP POLICY IF EXISTS "messages insert" ON messages;

CREATE POLICY "messages_insert_service_only"
  ON messages FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

- [ ] **Step 3: Apply**

Run: `npx supabase db push`
Expected: applied.

- [ ] **Step 4: Verify lock — direct insert must fail**

Run in SQL editor or via psql with an authenticated JWT:
```sql
INSERT INTO messages (match_id, sender_id, text, kind)
VALUES ('00000000-0000-0000-0000-000000000000', auth.uid(), 'bypass', 'user');
```
Expected: `new row violates row-level security policy`.

- [ ] **Step 5: Verify the edge function still works**

Send a clean message via the app. Expected: delivered.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260412010100_messages_rls_lockdown.sql
git commit -m "feat(db): lock messages INSERT to service_role only"
```

---

## Task 10: Notion `Violations` DB setup (manual + env)

**Files:**
- (no code; manual Notion setup + secrets)

- [ ] **Step 1: Create Notion database**

In Notion, create a new database called `Violations` with these properties:
- Title (default)
- User Email — Email
- User Name — Text
- Role — Select (shipper, owner, admin)
- Match — Text
- Detector — Select (email, email_spelled, phone, phone_sequence, email_sequence, tg_handle, tg_link, wa)
- Severity — Select (low, medium, high)
- Snippet — Text
- Created — Date
- Supabase ID — Text

Share the database with the existing Notion integration.

- [ ] **Step 2: Add aggregate columns to existing `Users` Notion DB**

On the Users DB, add:
- `Violations Count` — Number
- `Last Violation At` — Date
- `Last Violation Type` — Select (same options as Detector)

- [ ] **Step 3: Set Supabase secret**

Run: `npx supabase secrets set NOTION_VIOLATIONS_DB_ID=<the-new-db-id>`
Expected: ok. (`NOTION_TOKEN` and `NOTION_USERS_DB_ID` already exist.)

- [ ] **Step 4: Commit a stub note (no code)**

```bash
git commit --allow-empty -m "chore(notion): provision violations db (manual)"
```

---

## Task 11: `notion-sync-violations` edge function

**Files:**
- Create: `supabase/functions/notion-sync-violations/index.ts`

- [ ] **Step 1: Implement**

Create file:
```ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROLE_LABEL: Record<string, string> = {
  shipper: "Грузовладелец",
  owner: "Владелец вагонов",
  admin: "Админ",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const token = Deno.env.get("NOTION_TOKEN");
  const violationsDb = Deno.env.get("NOTION_VIOLATIONS_DB_ID");
  const usersDb = Deno.env.get("NOTION_USERS_DB_ID");
  if (!token || !violationsDb || !usersDb) {
    return json({ error: "missing env" }, 400);
  }

  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: rows, error } = await svc
    .from("chat_violations")
    .select("id, user_id, match_id, detector, severity, snippet, created_at, profiles!inner(email, name, role)")
    .is("notion_synced_at", null)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) return json({ error: error.message }, 500);

  let synced = 0, skipped = 0, errors = 0;
  const userPagesCache = new Map<string, string>(); // email → notion page id

  for (const row of rows ?? []) {
    try {
      const profile = (row as any).profiles;
      const exists = await findExisting(token, violationsDb, row.id);
      if (!exists) {
        await fetch(`${NOTION_API}/pages`, {
          method: "POST",
          headers: notionHeaders(token),
          body: JSON.stringify({
            parent: { database_id: violationsDb },
            properties: {
              Name: { title: [{ text: { content: `${ROLE_LABEL[profile.role] ?? profile.role} — ${row.detector}` } }] },
              "User Email": { email: profile.email ?? null },
              "User Name": { rich_text: [{ text: { content: profile.name ?? "—" } }] },
              Role: { select: { name: ROLE_LABEL[profile.role] ?? profile.role } },
              Match: { rich_text: [{ text: { content: row.match_id.slice(0, 8) } }] },
              Detector: { select: { name: row.detector } },
              Severity: { select: { name: row.severity } },
              Snippet: { rich_text: [{ text: { content: row.snippet.slice(0, 1900) } }] },
              Created: { date: { start: row.created_at } },
              "Supabase ID": { rich_text: [{ text: { content: row.id } }] },
            },
          }),
        });
      }

      // Aggregate update on Users DB
      if (profile.email) {
        const userPageId = userPagesCache.get(profile.email)
          ?? await findUserPage(token, usersDb, profile.email);
        if (userPageId) {
          userPagesCache.set(profile.email, userPageId);
          const agg = await svc
            .from("chat_violations")
            .select("detector, created_at")
            .eq("user_id", row.user_id)
            .order("created_at", { ascending: false });
          const list = agg.data ?? [];
          await fetch(`${NOTION_API}/pages/${userPageId}`, {
            method: "PATCH",
            headers: notionHeaders(token),
            body: JSON.stringify({
              properties: {
                "Violations Count": { number: list.length },
                "Last Violation At": list[0] ? { date: { start: list[0].created_at } } : { date: null },
                "Last Violation Type": list[0] ? { select: { name: list[0].detector } } : { select: null },
              },
            }),
          });
        }
      }

      await svc
        .from("chat_violations")
        .update({ notion_synced_at: new Date().toISOString() })
        .eq("id", row.id);

      if (exists) skipped++; else synced++;
      await sleep(350);
    } catch (e) {
      errors++;
      console.error("sync row failed", row.id, e);
    }
  }

  return json({ synced, skipped, errors, total: rows?.length ?? 0 }, 200);
});

function notionHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function findExisting(token: string, db: string, supabaseId: string): Promise<boolean> {
  const r = await fetch(`${NOTION_API}/databases/${db}/query`, {
    method: "POST",
    headers: notionHeaders(token),
    body: JSON.stringify({
      filter: { property: "Supabase ID", rich_text: { equals: supabaseId } },
      page_size: 1,
    }),
  });
  const d = await r.json();
  return (d.results ?? []).length > 0;
}

async function findUserPage(token: string, db: string, email: string): Promise<string | null> {
  const r = await fetch(`${NOTION_API}/databases/${db}/query`, {
    method: "POST",
    headers: notionHeaders(token),
    body: JSON.stringify({
      filter: { property: "Email", email: { equals: email } },
      page_size: 1,
    }),
  });
  const d = await r.json();
  return d.results?.[0]?.id ?? null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const json = (b: unknown, s: number) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
```

- [ ] **Step 2: Deploy**

Run: `npx supabase functions deploy notion-sync-violations`
Expected: deploy success.

- [ ] **Step 3: Manual trigger**

Insert a test violation:
```sql
INSERT INTO chat_violations (user_id, match_id, detector, severity, snippet)
VALUES ('<some real user uuid>', '<some real match uuid>', 'phone', 'high', '+79991234567');
```
Then:
```bash
curl -X POST https://<project>.functions.supabase.co/notion-sync-violations \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```
Expected: `{"synced":1,...}` and a row appears in the Notion Violations DB.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/notion-sync-violations/
git commit -m "feat(notion): add notion-sync-violations edge function"
```

---

## Task 12: Schedule cron

**Files:**
- Create: `supabase/migrations/20260412010200_notion_sync_violations_cron.sql`

- [ ] **Step 1: Write migration**

Create file:
```sql
-- Requires pg_cron + pg_net extensions (already enabled in this project).
SELECT cron.schedule(
  'notion-sync-violations',
  '*/5 * * * *',
  $$ SELECT net.http_post(
       url := 'https://' || current_setting('app.settings.project_ref') || '.functions.supabase.co/notion-sync-violations',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
         'Content-Type', 'application/json'
       ),
       body := '{}'::jsonb
     ); $$
);
```

If `app.settings.project_ref` / `service_role_key` are not configured in this project, the migration should be replaced with a hardcoded URL + a Supabase Vault reference. Check `supabase/migrations/` for prior cron examples before applying. If none exist, fall back to scheduling via the Supabase dashboard and replace this file with a comment-only migration documenting the schedule.

- [ ] **Step 2: Apply**

Run: `npx supabase db push`
Expected: applied. If it fails because of missing settings, follow the fallback noted in Step 1.

- [ ] **Step 3: Verify schedule**

Run: `npx supabase db execute "select jobname, schedule from cron.job where jobname='notion-sync-violations';"`
Expected: one row, `*/5 * * * *`.

- [ ] **Step 4: Wait 5 min, insert another test violation, confirm it appears in Notion**

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260412010200_notion_sync_violations_cron.sql
git commit -m "feat(cron): schedule notion-sync-violations every 5 min"
```

---

## Task 13: AdminPanel violations badge + modal

**Files:**
- Modify: `components/AdminPanel.jsx`

- [ ] **Step 1: Read the user-row render block**

Run: `grep -n "profiles\|map(" components/AdminPanel.jsx | head -30`
Identify where each user row is rendered.

- [ ] **Step 2: Fetch counts alongside profiles**

In the existing profiles loader, change the `select` to include violations count via a sub-select:
```js
const { data: profiles } = await supabase
  .from("profiles")
  .select("*, chat_violations(count)")
  .order("created_at", { ascending: false });
```
Each profile then has `chat_violations: [{ count: N }]`.

- [ ] **Step 3: Render badge**

In the user-row JSX, after the name/email block, add:
```jsx
{(p.chat_violations?.[0]?.count ?? 0) > 0 && (
  <button
    onClick={() => setViolationsFor(p.id)}
    className="ml-2 inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
  >
    Нарушения: {p.chat_violations[0].count}
  </button>
)}
```

- [ ] **Step 4: Add modal**

At the bottom of the component, before the closing tag, add:
```jsx
{violationsFor && (
  <ViolationsModal userId={violationsFor} onClose={() => setViolationsFor(null)} />
)}
```
And inside the same file (or a sibling component) define:
```jsx
function ViolationsModal({ userId, onClose }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    supabase
      .from("chat_violations")
      .select("id, detector, severity, snippet, created_at, match_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="max-h-[80vh] w-[640px] overflow-auto rounded bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-lg font-semibold">Нарушения пользователя</h2>
        {rows.length === 0 && <p className="text-gray-500">Пусто</p>}
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded border p-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{r.detector}</span>
                <span className="text-gray-500">{new Date(r.created_at).toLocaleString()}</span>
              </div>
              <div className="text-gray-700">{r.snippet}</div>
              <div className="text-xs text-gray-400">match {r.match_id.slice(0, 8)}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```
Add `const [violationsFor, setViolationsFor] = useState(null);` near the other useState calls. Import `useEffect, useState` if not already.

- [ ] **Step 5: Manual verify**

Run: `npm run build && npm run dev`
Log in as admin, see the badge on a user with violations, click → modal lists rows.

- [ ] **Step 6: Commit**

```bash
git add components/AdminPanel.jsx
git commit -m "feat(admin): show chat violations badge and modal"
```

---

## Task 14: Client mirror parity test

**Files:**
- Create: `tests/anti-leak.test.js`

- [ ] **Step 1: Write parity tests**

Create file:
```js
import { describe, it, expect } from "vitest";
import { detect, normalize } from "../src/anti-leak.js";

describe("client anti-leak mirror", () => {
  it("normalizes homoglyphs", () => {
    expect(normalize("ареса")).toBe("apeca");
  });
  it("detects email", () => {
    expect(detect("write me at john@example.com")?.detector).toBe("email");
  });
  it("detects phone", () => {
    expect(detect("звони +79991234567")?.detector).toBe("phone");
  });
  it("detects t.me link", () => {
    expect(detect("t.me/foo")?.detector).toBe("tg_link");
  });
  it("returns null on clean text", () => {
    expect(detect("когда грузим в марте")).toBeNull();
  });
});
```

- [ ] **Step 2: Run, expect PASS**

Run: `npm test`
Expected: 5 passed.

- [ ] **Step 3: Commit**

```bash
git add tests/anti-leak.test.js
git commit -m "test(anti-leak): client mirror parity"
```

---

## Task 15: Final smoke + cleanup

- [ ] **Step 1: End-to-end smoke**

In the deployed/staging app:
1. Send `привет когда грузим` → delivered
2. Send `+79991234567` → blocked, row in `chat_violations`
3. Send across 5 messages: `мой`, `+7`, `999`, `123`, `4567` → last message blocked with `phone_sequence`
4. Send `ivan@mail.ru` → blocked, `email`
5. Send `пиши в @ivan_petrov` → blocked, `tg_handle`
6. Send `t.me/ivan` → blocked, `tg_link`
7. Try direct REST insert into `messages` with an authenticated JWT → 401/403
8. Wait 5 min, refresh Notion Violations DB → all blocked attempts present
9. Open AdminPanel → badge shows count, modal lists rows

- [ ] **Step 2: Decide on `src/security.js`**

Run: `grep -rn "from ['\"].*security['\"]" src/ components/ app.jsx`
- If still imported by client code → replace those imports with `src/anti-leak.js` and delete `src/security.js`.
- If unused → delete `src/security.js`.

- [ ] **Step 3: Run all tests**

Run: `npm test && deno test supabase/functions/_shared/anti-leak.test.ts && deno test supabase/functions/send-chat-message/index.test.ts --allow-net --allow-env`
Expected: all green.

- [ ] **Step 4: Commit cleanup**

```bash
git add -A
git commit -m "chore(anti-leak): drop legacy src/security.js"
```

---

## Spec Coverage Map

| Spec section                              | Tasks       |
|-------------------------------------------|-------------|
| §1 Server-side enforcement                | 6, 7, 8     |
| §1 RLS lock on `messages`                 | 9           |
| §2 Latin whitelist normalizer             | 2           |
| §3 Fuzzy email/phone/handle               | 3           |
| §4 Cross-party sequence detector          | 4           |
| §5.1 `chat_violations` table              | 5           |
| §5.2 Notion Violations DB                 | 10, 11      |
| §5.3 Users DB aggregates                  | 10, 11      |
| §5.4 `notion-sync-violations` function    | 11          |
| §5.5 pg_cron schedule                     | 12          |
| §5.6 AdminPanel badge + modal             | 13          |
| Testing strategy                          | 1, 2, 3, 4, 6, 7, 14 |
| Migration / rollout order                 | 5 → 6 → 8 → 9 → 10 → 11 → 12 → 13 |
