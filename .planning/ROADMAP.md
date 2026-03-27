# Roadmap: RailMatch Anti

## Overview

Платформа на ~75% готова. Milestone 1 закрывает путь к production: стабилизация core flow, уведомления о событиях сделки, верификация компаний и реальная аналитика. Платёжная интеграция — Milestone 2.

## Milestone 1: Production Launch

- [x] **Phase 1: Стабилизация** — Миграции, RLS, тест полного pipeline, фиксы заглушек (completed 2026-03-26)
- [ ] **Phase 2: Telegram уведомления** — Уведомления о ставках, сообщениях, статусах
- [ ] **Phase 3: Email уведомления** — Resend + дублирование ключевых событий
- [ ] **Phase 4: Верификация компаний (backend)** — Edge Function подтверждения/отклонения документов
- [ ] **Phase 5: Реальная аналитика** — Убрать hardcoded данные, KPI из БД

## Phase Details

### Phase 1: Стабилизация
**Goal**: Все критические flow работают корректно в production
**Depends on**: Nothing
**Requirements**: STAB-02, STAB-03, STAB-04, STAB-05, STAB-06
**Success Criteria**:
  1. Все миграции применены, схема БД полная без ошибок
  2. Новый пользователь регистрируется → получает правильную роль → попадает в приложение
  3. Shipper создаёт заявку → Owner делает ставку → чат открывается → комиссия согласована → контакты раскрыты
  4. RLS: owner не может редактировать чужую заявку, shipper не видит чужие bids
  5. Кнопки в UserDashboard ведут на реальные разделы
**Plans**: 6 plans

Plans:
- [x] 01-01-PLAN.md — Write migration 22: canonical RLS policies for all 4 tables + Realtime
- [x] 01-02-PLAN.md — Wire UserDashboard, MyBidsView, FleetDislocation into app.jsx navigation
- [~] 01-03-PLAN.md — Apply migration in Supabase, verify RLS + Realtime, E2E pipeline test [PARTIAL: 3 pipeline failures — cancellation broken, bid price logic wrong, chat missing for shipper]
- [~] 01-04-PLAN.md — Fix request cancellation (gap closure) [Task 1 done, awaiting human-verify Task 2]
- [~] 01-05-PLAN.md — Fix minimum bid price validation (gap closure) [Task 1 done, awaiting human-verify Task 2]
- [~] 01-06-PLAN.md — Fix chat/messaging for Shipper side (gap closure) [Task 1 done, awaiting human-verify Task 2]

### Phase 2: Telegram уведомления
**Goal**: Пользователи получают Telegram-уведомления о ключевых событиях своих сделок
**Depends on**: Phase 1
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04
**Success Criteria**:
  1. Грузоотправитель получает сообщение в Telegram когда кто-то откликнулся на его заявку
  2. Участник чата получает уведомление о новом сообщении
  3. Владелец получает уведомление о принятии/отклонении ставки
  4. Обе стороны получают уведомление при раскрытии контактов
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Deploy telegram-notify, telegram-bot, verify-linking-code; register webhook; smoke-test linking + delivery
- [ ] 02-02-PLAN.md — Add sendNotification to handleSendMessage (NOTIF-02) + handleAcceptBid + "Принять ставку" button (NOTIF-03)
- [ ] 02-03-PLAN.md — Human verify all 4 NOTIF requirements end-to-end with real Telegram accounts

### Phase 3: Email уведомления
**Goal**: Ключевые события дублируются на email через Resend
**Depends on**: Phase 2
**Requirements**: EMAIL-01, EMAIL-02
**Success Criteria**:
  1. RESEND_API_KEY добавлен в Supabase secrets
  2. Email отправляется при тех же событиях что и Telegram (NOTIF-01..04)
**Plans**: TBD

### Phase 4: Верификация компаний (backend)
**Goal**: Admin может подтверждать/отклонять верификацию, статус применяется к профилю
**Depends on**: Phase 1
**Requirements**: VERIF-01, VERIF-02, VERIF-03
**Success Criteria**:
  1. Admin нажимает "Подтвердить" → verification_status = 'verified', is_verified = true
  2. Admin нажимает "Отклонить" → verification_status = 'unverified', документы сбрасываются
  3. Верифицированный пользователь имеет увеличенный bids_limit
**Plans**: TBD

### Phase 5: Реальная аналитика
**Goal**: Все дашборды показывают реальные данные из БД
**Depends on**: Phase 1
**Requirements**: ANAL-01, ANAL-02, ANAL-03
**Success Criteria**:
  1. Загрузка парка в MyBidsView считается из реальных bids
  2. Карта вагонов в FleetDislocation берёт данные из таблицы wagons
  3. KPI в AnalyticsDashboard — реальные агрегаты, не моки
**Plans**: TBD

## Milestone 2: Monetization

- [ ] **Phase 6: Платежи** — Tinkoff / ЮKassa интеграция для комиссии платформы
