---
phase: 02-telegram-notifications
plan: 01
subsystem: infra
tags: [telegram, edge-functions, supabase, webhook, deno]

# Dependency graph
requires:
  - phase: 01-stabilizaciya
    provides: stable app with profiles.telegram_id and telegram_link_token columns (migration 13)
provides:
  - telegram-notify Edge Function deployed and active
  - telegram-bot Edge Function deployed with Telegram webhook registered
  - verify-linking-code Edge Function deployed and active
  - Telegram notification pipeline unblocked for NOTIF-01 through NOTIF-04
affects:
  - 02-02 (NOTIF-02 message notification code changes now testable)
  - 02-03 (NOTIF-03 accept-bid UI now testable)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase functions deploy with --workdir to ensure correct project directory is used"
    - "Temporary helper Edge Function for one-time operations (register-webhook, deleted after use)"

key-files:
  created: []
  modified: []

key-decisions:
  - "Used temporary register-webhook Edge Function to call setWebhook from within Supabase runtime (TELEGRAM_BOT_TOKEN not available locally)"
  - "verify-linking-code requires BOT_WEBHOOK_SECRET — confirmed present in Supabase secrets"
  - "BOT_WEBHOOK_SECRET already set in secrets — no action needed"

patterns-established:
  - "supabase functions deploy requires --workdir flag on Windows when CLI workdir defaults to home directory"

requirements-completed: []

# Metrics
duration: 15min
completed: 2026-03-28
---

# Phase 02 Plan 01: Telegram Infrastructure Deployment Summary

**Three Telegram Edge Functions deployed to Supabase, webhook registered — notification pipeline unblocked for all NOTIF-01..04 requirements**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-28T~09:37:00Z
- **Completed:** 2026-03-28T~09:52:00Z
- **Tasks:** 1 of 2 complete (Task 2 awaiting human verification)
- **Files modified:** 0 (deployment-only task)

## Accomplishments
- Deployed `telegram-notify` (v4), `telegram-bot` (v4), `verify-linking-code` (v2) — all ACTIVE
- Registered Telegram webhook for `telegram-bot` — setWebhook returned `{"ok":true,"result":true,"description":"Webhook was set"}`
- Confirmed TELEGRAM_BOT_TOKEN and BOT_WEBHOOK_SECRET present in Supabase secrets

## Task Commits

Each task was committed atomically:

1. **Task 1: Deploy Edge Functions and register Telegram webhook** - `4249bea` (chore)

**Plan metadata:** TBD (after human verification)

## Files Created/Modified

None — Task 1 was pure deployment via Supabase CLI. No source files were created or modified.

## Decisions Made

- Used a temporary `register-webhook` Edge Function to call `setWebhook` from within the Supabase runtime environment. This was necessary because `TELEGRAM_BOT_TOKEN` is stored as a Supabase secret and is not accessible locally. The helper function was deployed, invoked once, then deleted from both Supabase and the repo.
- `supabase functions deploy` requires `--workdir` flag on Windows — without it the CLI defaults to the home directory and fails to find function files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used temporary Edge Function to register Telegram webhook**
- **Found during:** Task 1 (Deploy Edge Functions and register Telegram webhook)
- **Issue:** Plan called for `curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=..."` but TELEGRAM_BOT_TOKEN is only accessible as a Supabase secret, not locally. Direct curl was not possible.
- **Fix:** Created `supabase/functions/register-webhook/index.ts` (single-use), deployed it, invoked via HTTP using the project anon key, then deleted the function from Supabase and removed the file from the repo.
- **Files modified:** None (temp file created and deleted)
- **Verification:** HTTP response was `{"ok":true,"result":true,"description":"Webhook was set"}`
- **Committed in:** 4249bea (Task 1 commit — temp function was never committed)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary workaround for secrets isolation. No scope creep.

## Issues Encountered

- Supabase CLI `functions invoke` command not available in CLI v2.75.0 — worked around by calling the deployed function directly via HTTP with the project anon key.
- `supabase functions deploy verify-linking-code` failed on first attempt because CLI was using wrong workdir (C:\Users\HomePc instead of project dir) — fixed by adding `--workdir` flag.

## User Setup Required

**Task 2 smoke test required.** See plan Task 2 for exact steps:
1. Open app → Profile Settings → click "Привязать Telegram" → get token
2. Send `/start <TOKEN>` to the Telegram bot
3. Verify telegram_id saved in profile
4. Run: `supabase functions invoke telegram-notify --body '{"user_id":"<your-uuid>","message":"Тест уведомлений RailMatch"}'`
5. Verify Telegram message received

## Next Phase Readiness

- All three Edge Functions deployed and active
- Telegram webhook registered — `/start TOKEN` linking flow operational
- Ready for NOTIF-02 and NOTIF-03 code changes (Plan 02-02 and 02-03)
- Blocked on: human smoke test (Task 2) to confirm end-to-end delivery

---
*Phase: 02-telegram-notifications*
*Completed: 2026-03-28*
