---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: blocked
stopped_at: "01-03-PLAN.md — PARTIAL: 3 pipeline failures found, Phase 1 cannot close"
last_updated: "2026-03-23T00:00:00Z"
last_activity: 2026-03-23 — E2E pipeline tested. Migration 22 + RLS confirmed. 3 critical failures in pipeline (cancellation, bid price logic, chat for shipper side).
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 3
  completed_plans: 2
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-21)

**Core value:** Защищённый чат с антиутечкой, гарантирующий монетизацию через платформу
**Current focus:** Phase 1 — Стабилизация (blocked — 3 pipeline failures pending fix)

## Current Position

Phase: 1 of 5 (Стабилизация)
Plan: 3 of 3 — PARTIAL (pipeline test failed)
Status: Blocked — awaiting fix plans for 3 critical failures
Last activity: 2026-03-23 — E2E pipeline tested. Migration 22 + RLS confirmed active. 3 critical pipeline failures found during manual testing.

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

### Известные проблемы

- `FleetDislocation.jsx` — данные вагонов hardcoded + mock ЭТРАН sync
- `MyBidsView.jsx` — загрузка парка hardcoded 78%
- Порядок применения миграций не проверен (могут быть конфликты между `anti_railmatch/migrations/` и корневыми `migrations/`)

### Blockers/Concerns

- **[CRITICAL] Отмена заявки не работает** — Shipper не может отменить поданную заявку. Нужен fix plan.
- **[CRITICAL] Минимальная цена ставки — неверная логика** — Старое правило 100,000 flat активно. Нужна замена: 1 вагон → 45,000; >3 вагонов → 10,000/вагон. Нужен fix plan.
- **[CRITICAL] Чат недоступен для грузоотправителя** — После отклика Owner, чат видит только Owner. Shipper не видит чат, не получает уведомления, не видит сообщения. Нужен fix plan.
- RESEND_API_KEY не добавлен в Supabase secrets → email уведомления не работают
- Две папки с миграциями: `anti_railmatch/migrations/` (01-12) и `migrations/` в корне (01-20 + доп.)

## Session Continuity

Last session: 2026-03-23T00:00:00Z
Stopped at: 01-03-PLAN.md — PARTIAL outcome documented in 01-03-SUMMARY.md
Resume file: None
Next action: Create fix plans for the 3 critical pipeline failures before Phase 1 can close
