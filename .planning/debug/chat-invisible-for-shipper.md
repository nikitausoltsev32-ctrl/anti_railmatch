---
status: awaiting_human_verify
trigger: "chat-invisible-for-shipper: Owner bids on shipper's request, shipper cannot see chat or get notification"
created: 2026-03-25T00:00:00Z
updated: 2026-03-25T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - RLS policies compare shipperInn against auth.uid()::text (UUID), but shipperInn stores userProfile.inn (INN number). They never match.
test: n/a - confirmed by code reading
expecting: n/a
next_action: Create migration 25 to fix RLS policies for bids and messages

## Symptoms

expected: When a bid is placed on a request, both parties see the chat and get notifications
actual: Owner places bid on shipper's request - owner sees chat, shipper does NOT see chat, no notification
errors: No error messages - silently fails to show
reproduction: 1) Login as shipper, create request 2) Login as owner, place bid 3) Owner sees chat 4) Shipper sees nothing
started: Known since 2026-03-23 pipeline testing

## Eliminated

## Evidence

- timestamp: 2026-03-25
  checked: migrations/22_enable_rls_final_policies.sql - RLS on bids table
  found: SELECT policy uses `"shipperInn" = auth.uid()::text` (line 39)
  implication: Compares shipperInn against UUID

- timestamp: 2026-03-25
  checked: app.jsx line 1086 - request creation
  found: `shipperInn: userProfile.inn || '000000'` — stores INN, not UUID
  implication: shipperInn field contains INN like '9123456789', NOT UUID

- timestamp: 2026-03-25
  checked: app.jsx line 174 - profile creation
  found: `inn` field is generated as `9${Date.now().toString().slice(-9)}` — a 10-digit number
  implication: INN is never equal to auth.uid()::text (a UUID), so RLS never matches for shipper

- timestamp: 2026-03-25
  checked: app.jsx line 1432 - messenger filter
  found: JS-side filter uses `r.shipperInn === userProfile?.inn` — correctly matches INN to INN
  implication: JS filter is correct, but data never reaches client because RLS blocks it

- timestamp: 2026-03-25
  checked: Same pattern in messages RLS (migration 22, lines 82-85)
  found: Messages RLS also chains through bids -> requests -> shipperInn = auth.uid()::text
  implication: Shipper can't see messages either — same root cause

- timestamp: 2026-03-25
  checked: Realtime subscriptions (app.jsx lines 365-392)
  found: Supabase Realtime respects RLS, so shipper never receives bid/message INSERT events
  implication: No realtime notifications for shipper — explains "no notification" symptom

## Resolution

root_cause: RLS policies on bids and messages tables compare requests.shipperInn against auth.uid()::text (a UUID), but shipperInn actually stores the user's INN (a 10-digit number from userProfile.inn). These values never match, so shippers are blocked by RLS from seeing bids on their requests and all associated messages.
fix: Created migration 25_fix_shipper_rls_inn_mismatch.sql. Replaces `"shipperInn" = auth.uid()::text` with `"shipperInn" = (SELECT inn FROM public.profiles WHERE id = auth.uid())` in all affected RLS policies (requests UPDATE, bids SELECT/UPDATE, messages SELECT, deal_documents INSERT/UPDATE).
verification: Pending human verification — migration must be applied to Supabase and tested with real accounts.
files_changed: [migrations/25_fix_shipper_rls_inn_mismatch.sql]
