---
phase: quick-1-telegram
plan: 1
subsystem: auth
tags: [telegram, auth, edge-function, onboarding]
dependency_graph:
  requires: [supabase/functions/telegram-notify, profiles.telegram_id]
  provides: [telegram-auth edge function, TelegramOnboarding component]
  affects: [AuthScreen, app.jsx]
tech_stack:
  added: [Telegram Login Widget, Web Crypto API (Deno)]
  patterns: [admin.createSession for token-less auth, fake email pattern for Telegram users]
key_files:
  created:
    - supabase/functions/telegram-auth/index.ts
  modified:
    - components/AuthScreen.jsx
    - app.jsx
    - .env
decisions:
  - Fake email pattern tg_{id}@railmatch.internal for Telegram users to avoid email auth flow
  - admin.createSession used to issue sessions without password — avoids storing fake passwords
  - Widget disabled in dev (import.meta.env.DEV check) — Telegram widget requires production domain
  - needsTelegramOnboarding state in app.jsx gates TelegramOnboarding screen rendering
metrics:
  duration: ~15min
  completed_date: "2026-03-30"
  tasks_completed: 2
  tasks_total: 3
  files_created: 1
  files_modified: 3
---

# Quick Task 1 (Telegram Auth): Summary

**One-liner:** Telegram Login Widget auth via HMAC-SHA256 Edge Function with fake-email user creation and session issuance via admin.createSession.

## What Was Built

### Task 1: Edge Function `telegram-auth`

**File:** `supabase/functions/telegram-auth/index.ts`

POST endpoint that:
1. Verifies HMAC-SHA256 hash from Telegram Login Widget using `SHA256(BOT_TOKEN)` as key
2. Rejects auth_date older than 24 hours (401)
3. Looks up `profiles.telegram_id` for existing users
4. Existing user with role: issues session via `supabase.auth.admin.createSession({ user_id })`
5. Existing user without role: issues session + returns `needs_onboarding: true`
6. New user: creates with `admin.createUser({ email: tg_{id}@railmatch.internal, email_confirm: true })`, updates profile with telegram_id, issues session + returns `needs_onboarding: true`

Response shape: `{ access_token, refresh_token, needs_onboarding: boolean }`

### Task 2: AuthScreen + app.jsx

**AuthScreen.jsx changes:**
- Added `TelegramOnboarding` named export — form for role/name/company/phone for first-time Telegram users
- Added Telegram Login Widget via dynamic script injection (production only; shows placeholder in dev)
- Added "или" divider between widget and email/password form
- New prop `onTelegramAuth` passed from app.jsx

**app.jsx changes:**
- `handleTelegramAuth`: fetches telegram-auth edge function, calls `supabase.auth.setSession()`, sets `needsTelegramOnboarding` if needed
- `handleTelegramOnboarding`: updates profile with role/name/company/phone, clears onboarding flag
- `needsTelegramOnboarding` state gates rendering of `TelegramOnboarding` screen
- `TelegramOnboarding` imported from AuthScreen

**.env:**
- Added `VITE_TELEGRAM_BOT_USERNAME=railmatch_bot`

## Deploy Notes

Before the checkpoint verification:

1. Deploy edge function: `supabase functions deploy telegram-auth`
2. Verify secret is set: `supabase secrets list | grep TELEGRAM_BOT_TOKEN`
3. If not set: `supabase secrets set TELEGRAM_BOT_TOKEN=<your_token>`
4. In BotFather: Bot Settings → Domain → set production domain
5. Production URL required (widget won't load on localhost)

## Commits

- `bca44c7` feat(quick-1-telegram-1): add telegram-auth edge function
- `8e785cb` feat(quick-1-telegram-1): add Telegram Login Widget to AuthScreen and wire handlers in app.jsx

## Deviations from Plan

None — plan executed exactly as written.

## Status

**Paused at checkpoint:human-verify** — awaiting deploy + production smoke test.
