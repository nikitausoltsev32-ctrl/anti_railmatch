# RailMatch Anti

## What This Is

B2B платформа для матчинга железнодорожных грузоперевозок. Грузоотправители публикуют заявки на перевозку, владельцы вагонов делают ставки. Стороны общаются в защищённом чате, платформа берёт комиссию 2.5% при раскрытии контактов.

## Core Value

Защищённый чат с антиутечкой, который гарантирует что сделки проходят через платформу — без этого монетизация невозможна.

## Tech Stack

- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Supabase (PostgreSQL, Auth, Realtime, Edge Functions, Storage)
- Email: Resend (Edge Function `notify`, ключ не подключён)
- Notifications: Telegram Bot API + Edge Functions
- Deploy: Vercel (frontend) + Supabase (backend)
- GitHub: https://github.com/nikitausoltsev32-ctrl/anti_railmatch

## Requirements

### Validated

- Биржа заявок в реальном времени (Realtime subscriptions)
- Регистрация с выбором роли (shipper/owner) через Edge Function
- 4-этапный pipeline сделки: переговоры → комиссия → оплата → раскрытие контактов
- Антиутечка 4 уровней (предупреждение → блок 24ч → снятие верификации → бан)
- Генерация PDF документов (договор, УПД, накладная, акт)
- Telegram Mini App + привязка аккаунтов
- AdminPanel (статистика, рассылки)
- Демо-режим

### Active

- [ ] Стабилизация: миграции, RLS, тест полного flow
- [ ] Telegram уведомления о событиях сделки
- [ ] Email уведомления через Resend
- [ ] Верификация компаний (backend логика)
- [ ] Реальная аналитика вместо hardcoded данных

### Out of Scope

| Feature | Reason |
|---------|--------|
| ЭТРАН API интеграция | Долгий ящик — нет доступа к API |
| Электронная подпись (ЭЦП) | Overengineering на текущем этапе |
| Документооборот внутри чата | Overengineering |
| Telegram Mini App (новый функционал) | Уже сделан |

## Key Decisions

| Date | Decision | Reason |
|------|----------|--------|
| 2026-03-21 | Регистрация через Edge Function вместо signUp | Устранение бага с ролью — триггер БД перезаписывал роль |
| 2026-03-21 | UPSERT вместо INSERT в Edge Function | Триггер on_auth_user_created создаёт профиль раньше функции |
| 2026-03-21 | role передаётся через formData, не closure | Гарантирует актуальное значение при сабмите |

## Суpabase

- Project ID: `xakyjvlxypivrmuehsxl`
- Region: us-west-2
- URL: https://xakyjvlxypivrmuehsxl.supabase.co
