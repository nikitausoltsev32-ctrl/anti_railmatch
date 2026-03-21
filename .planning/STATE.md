---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Completed 01-stabilizaciya-02-PLAN.md
last_updated: "2026-03-21T20:16:34.672Z"
last_activity: 2026-03-21 — GSD инициализирован, roadmap утверждён. Исправлен баг регистрации (роль всегда owner). Edge Function send-confirmation-email задеплоена v3 с UPSERT.
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
**Current focus:** Phase 1 — Стабилизация

## Current Position

Phase: 1 of 5 (Стабилизация)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-03-21 — GSD инициализирован, roadmap утверждён. Исправлен баг регистрации (роль всегда owner). Edge Function send-confirmation-email задеплоена v3 с UPSERT.

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

### Известные проблемы

- `UserDashboard.jsx` — 6 кнопок быстрых действий вызывают `console.log` вместо реальной навигации
- `FleetDislocation.jsx` — данные вагонов hardcoded + mock ЭТРАН sync
- `MyBidsView.jsx` — загрузка парка hardcoded 78%
- Порядок применения миграций не проверен (могут быть конфликты между `anti_railmatch/migrations/` и корневыми `migrations/`)
- Realtime не проверен в production

### Blockers/Concerns

- RESEND_API_KEY не добавлен в Supabase secrets → email уведомления не работают
- Две папки с миграциями: `anti_railmatch/migrations/` (01-12) и `migrations/` в корне (01-20 + доп.)

## Session Continuity

Last session: 2026-03-21T20:16:34.660Z
Stopped at: Completed 01-stabilizaciya-02-PLAN.md
Resume file: None
