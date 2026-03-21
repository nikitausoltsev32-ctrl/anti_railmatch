---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Phase 1 context gathered
last_updated: "2026-03-21T19:55:41.766Z"
last_activity: 2026-03-21 — GSD инициализирован, roadmap утверждён. Исправлен баг регистрации (роль всегда owner). Edge Function send-confirmation-email задеплоена v3 с UPSERT.
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
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

Last session: 2026-03-21T19:55:41.749Z
Stopped at: Phase 1 context gathered
Resume file: .planning/phases/01-stabilizaciya/01-CONTEXT.md
