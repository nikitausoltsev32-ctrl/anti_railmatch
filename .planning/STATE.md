---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Blocked — awaiting fix plans for 3 critical failures
stopped_at: "01-06-PLAN.md — CHECKPOINT: Task 1 verified (code pre-implemented in ae08f8d), awaiting human-verify of bidirectional chat (Task 2)"
last_updated: "2026-03-26T10:42:00Z"
last_activity: 2026-03-26 — Plan 06 executed. myBidIds + messenger filter + onChat all correct for shipper. Awaiting human verification checkpoint.
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 6
  completed_plans: 5
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-21)

**Core value:** Защищённый чат с антиутечкой, гарантирующий монетизацию через платформу
**Current focus:** Phase 1 — Стабилизация (blocked — 3 pipeline failures pending fix)

## Current Position

Phase: 1 of 5 (Стабилизация)
Plan: 6 of 6 — CHECKPOINT (awaiting human verification of bidirectional chat)
Status: In Progress — all fix plans executed, pending Phase 1 closure after human verify
Last activity: 2026-03-26 — Plan 06 executed. All 3 critical fix plans (04, 05, 06) complete. Awaiting final human verification before Phase 1 closes.

Progress: ░░░░░░░░░░ 0% (Milestone 1)

## Accumulated Context

### Decisions

- **2026-03-21**: Регистрация через Edge Function `send-confirmation-email` вместо `supabase.auth.signUp` — устранение бага с ролью
- **2026-03-21**: UPSERT вместо INSERT в Edge Function — триггер `on_auth_user_created` создаёт профиль раньше
- **2026-03-21**: `role` передаётся через `formData` из AuthScreen, не из `regRole` closure
- [Phase 01-stabilizaciya]: Migration 22 uses DROP POLICY IF EXISTS + CREATE pattern for idempotent policy management across all 4 core tables
- [Phase 01-stabilizaciya]: auth.uid()::text used for shipperInn comparison; subquery joins allow shipper access to bids/messages without denormalizing data
- [Phase 01-stabilizaciya]: setView passed as prop to UserDashboard — consistent with existing MyRequestsView pattern
- [Phase 01-stabilizaciya]: Documents and Add credit buttons removed entirely from UserDashboard (deferred Phase 6+)
- **2026-03-23**: Minimum bid price rule: 1 wagon → 45,000 min; >3 wagons → 10,000/wagon min. Old flat 100,000 rule is wrong and must be removed.
- **2026-03-23**: Plan 01-03 outcome: PARTIAL. 3 critical pipeline failures found. Phase 1 stays open until all 3 are fixed and pipeline re-tested.
- [Phase 01-stabilizaciya]: Plan 04: Removed .select() after .update() in handleCancelRequest — eliminates false-negative error path under RLS (bbba780)
- [Phase 01-stabilizaciya]: Plan 05: BidModal.jsx already had correct validation (1 wagon->45k, 2+->10k). No 100,000 flat rule found anywhere. Pipeline test was stale.
- [Phase 01-stabilizaciya]: Plan 06: All shipper chat fixes were pre-implemented in ae08f8d (UUID shipperInn fix). myBidIds and messenger filter both use OR condition covering owner and shipper roles.

### Известные проблемы

- `FleetDislocation.jsx` — данные вагонов hardcoded + mock ЭТРАН sync
- `MyBidsView.jsx` — загрузка парка hardcoded 78%
- Порядок применения миграций не проверен (могут быть конфликты между `anti_railmatch/migrations/` и корневыми `migrations/`)

### Blockers/Concerns

- **[CRITICAL - FIXED in 01-04] Отмена заявки не работает** — Fixed: removed .select() false-negative from handleCancelRequest. Awaiting human verification (checkpoint Task 2).
- **[CRITICAL] Минимальная цена ставки — неверная логика** — Старое правило 100,000 flat активно. Нужна замена: 1 вагон → 45,000; >3 вагонов → 10,000/вагон. Нужен fix plan.
- **[CRITICAL - FIXED in 01-06] Чат недоступен для грузоотправителя** — Fixed: myBidIds includes shipper bids, messenger filter covers both roles, onChat callback wired in MyRequestsView. Root cause was UUID vs INN mismatch (fixed in ae08f8d). Awaiting human verification (checkpoint Task 2).
- RESEND_API_KEY не добавлен в Supabase secrets → email уведомления не работают
- Две папки с миграциями: `anti_railmatch/migrations/` (01-12) и `migrations/` в корне (01-20 + доп.)

## Session Continuity

Last session: 2026-03-26T10:42:00Z
Stopped at: 01-06-PLAN.md — CHECKPOINT: Task 1 verified, awaiting human-verify of bidirectional chat (Task 2)
Resume file: None
Next action: Human verifies bidirectional chat works in live app. If confirmed, Phase 1 can close and Phase 2 begins.
