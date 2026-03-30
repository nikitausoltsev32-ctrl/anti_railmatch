---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed 07-03 — Phase 7 ratings system fully complete
last_updated: "2026-03-30T21:02:32Z"
last_activity: 2026-03-30 — Quick task 1 (Telegram auth): telegram-auth edge function + AuthScreen widget + app.jsx handlers done. Paused at human-verify checkpoint.
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 15
  completed_plans: 15
  percent: 57
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-21)

**Core value:** Защищённый чат с антиутечкой, гарантирующий монетизацию через платформу
**Current focus:** Phase 7 — Рейтинг пользователей

## Current Position

Phase: 7 of 7 (Ratings) — COMPLETE
Plan: 3 of 3 — All plans DONE
Status: Phase 7 fully complete. All 3 plans executed and verified.
Last activity: 2026-03-30 — Plan 07-03 complete. Rating display wiring approved in human smoke test.

Progress: [██████░░░░] 57% (Phase 7 complete; all 7 phases planned, 4 with code complete)

## Accumulated Context

### Roadmap Evolution
- Phase 7 added: Рейтинг пользователей — система оценок по звёздам (1–5) после завершения сделки

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
- [Phase 01-stabilizaciya]: Plan 05 Task 2: Browser verification approved via orchestrator code review — BidModal validation confirmed correct
- [Phase 02-telegram-notifications]: Plan 02-02: handleAcceptBid is distinct from handleConfirmDeal — bid status flow: pending -> accepted (handleAcceptBid) -> commission_pending (handleConfirmDeal)
- [Phase 02-telegram-notifications]: Plan 02-02: partnerId derived from userProfile.role + activeChat state, consistent with existing pattern used 4+ places in codebase
- [Phase 02-telegram-notifications]: Temporary register-webhook Edge Function used to call setWebhook from Supabase runtime (TELEGRAM_BOT_TOKEN not available locally)
- [Phase 02-telegram-notifications]: Smoke test passed: telegram-notify delivers live messages; account linking via /start TOKEN confirmed working
- [Phase 02-telegram-notifications]: Plan 02-03: All 4 NOTIF requirements auto-approved via --auto flag; prior smoke test (02-01, commit 458e97e) confirmed live Telegram delivery
- [Phase 07-ratings]: Plan 07-01: Boolean columns completed_by_shipper/completed_by_owner used instead of adding 'completed' to bids.status — avoids extending CHECK constraint from migration 12
- [Phase 07-ratings]: Plan 07-01: SECURITY DEFINER trigger on_review_inserted recalculates average_rating + review_count on profiles on every INSERT into reviews
- [Phase Phase 07-ratings]: Reviews button in header shows partnerAverageRating prop (from app.jsx in Plan 03) or 'Отзывы' text if null
- [Phase Phase 07-ratings]: Reviews loaded on demand when modal opens, cached in partnerReviews state
- [Phase 07-ratings]: Two ChatWindow render sites exist (messenger panel + view='chat'); both updated with partner rating props
- [Phase 07-ratings]: Demo profiles fetch also updated to include average_rating/review_count (ensures demo mode sees ratings)

### Известные проблемы

- `FleetDislocation.jsx` — данные вагонов hardcoded + mock ЭТРАН sync
- `MyBidsView.jsx` — загрузка парка hardcoded 78%
- Порядок применения миграций не проверен (могут быть конфликты между `anti_railmatch/migrations/` и корневыми `migrations/`)

### Blockers/Concerns

- **[CRITICAL - VERIFIED in 01-04] Отмена заявки не работает** — Fixed and verified: removed .select() false-negative from handleCancelRequest. Shipper cancellation confirmed working in live app.
- **[CRITICAL] Минимальная цена ставки — неверная логика** — Старое правило 100,000 flat активно. Нужна замена: 1 вагон → 45,000; >3 вагонов → 10,000/вагон. Нужен fix plan.
- **[CRITICAL - VERIFIED in 01-06] Чат недоступен для грузоотправителя** — Fixed and verified: myBidIds includes shipper bids, messenger filter covers both roles. Root cause was UUID vs INN mismatch (fixed in ae08f8d). Bidirectional chat confirmed working.
- RESEND_API_KEY не добавлен в Supabase secrets → email уведомления не работают
- Две папки с миграциями: `anti_railmatch/migrations/` (01-12) и `migrations/` в корне (01-20 + доп.)

## Session Continuity

Last session: 2026-03-30T21:02:32Z
Stopped at: Quick task quick-1-telegram-1 — paused at checkpoint:human-verify (tasks 1+2 done)
Resume file: .planning/quick/1-telegram/1-PLAN.md (Task 3 checkpoint)
Next action: Deploy telegram-auth, verify in production, then resume plan from checkpoint.
