# Phase 2: Telegram уведомления - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Пользователи получают Telegram-уведомления о ключевых событиях своих сделок: новая ставка на заявку, новое сообщение в чате, принятие ставки, раскрытие контактов. Email-уведомления — Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Уведомления о сообщениях (NOTIF-02)

- Каждое отправленное сообщение → отдельный `sendNotification` партнёру (нет throttle, нет cooldown)
- Системные сообщения (вставляются автоматически кодом) — тоже триггерят уведомление получателю
- Онлайн-статус не учитывается — уведомление отправляется всегда
- Текст уведомления: фиксированный "у вас новое сообщение" без содержимого сообщения
- Получатель = партнёр по bid (не отправитель)

### Принятие ставки (NOTIF-03 + новый UI)

- В MyRequestsView для pending bids: кнопка "Принять ставку" вместо "Открыть чат"
- После нажатия: bid.status = 'accepted', кнопка меняется на "Открыть чат", переход в чат
- Owner получает Telegram-уведомление "ваша ставка принята"
- Кнопки "Отклонить ставку" нет — не нужна
- Несколько bids на одну заявку могут быть accepted одновременно — заявка остаётся открытой пока не раскрыты контакты хотя бы по одной из них
- Кнопка "Принять ставку" только в MyRequestsView, не в окне чата

### Деплой и инфраструктура (NOTIF-01..04)

- `TELEGRAM_BOT_TOKEN` уже добавлен в Supabase secrets
- Статус деплоя `telegram-notify` и `telegram-bot` неизвестен — нужно проверить и задеплоить через Supabase CLI
- Telegram-привязка аккаунта (`/start TOKEN` в боте) не тестировалась — проверить работоспособность в рамках фазы
- Деплой: `supabase functions deploy` — Claude пробует через CLI

### Уже реализовано (не переписывать)

- NOTIF-01: `sendNotification` на новую ставку уже есть — `app.jsx:606`
- NOTIF-04: `sendNotification` на раскрытие контактов уже есть — `app.jsx:976`
- `telegram-notify` Edge Function написана и готова — `supabase/functions/telegram-notify/index.ts`
- Telegram-привязка: schema в migration 13 (telegram_id, telegram_link_token), `telegram-bot` и `verify-linking-code` функции написаны

</decisions>

<specifics>
## Specific Ideas

- Принятие ставки меняет кнопку на месте (в том же списке), а не переходит в новый экран — UX-переход в чат после принятия
- Если у пользователя нет telegram_id в профиле — уведомление тихо пропускается (`skipped: true`), не бросает ошибку — это уже реализовано в `telegram-notify`

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- `sendNotification(toUserId, subject, bodyText)` — `app.jsx:140` — уже вызывает telegram-notify + email, fire-and-forget
- `telegram-notify` Edge Function — `supabase/functions/telegram-notify/index.ts` — принимает `{ user_id, message }`, ищет telegram_id из profiles
- `handleSendMessage` — `app.jsx:618` — отправка сообщений, сюда нужно добавить `sendNotification` для NOTIF-02
- `telegram-bot` Edge Function — `supabase/functions/telegram-bot/index.ts` — обрабатывает `/start TOKEN` для привязки аккаунта

### Established Patterns

- `sendNotification` вызывается после успешного `.update()` или `.insert()` — паттерн устоявшийся, не менять
- `partnerId` вычисляется как `userProfile.role === 'shipper' ? bid.ownerId : bid.shipperInn` — используется повсюду
- Bid статусы: `pending` → `accepted` (новый переход) → `contacts_revealed`

### Integration Points

- `MyRequestsView.jsx` — добавить кнопку "Принять ставку" для bids со статусом `pending`, callback `onAcceptBid(bidId)` в app.jsx
- `app.jsx:handleSendMessage` (line 724–734) — добавить `sendNotification` после успешного insert в messages
- `app.jsx` — добавить `handleAcceptBid(bidId)` функцию: update bid status + sendNotification owner + setActiveChat + setView('chat')
- Supabase: bid.status уже имеет значение `accepted` в коде (используется в фильтрах) — новый переход `pending → accepted` легитимен

</code_context>

<deferred>
## Deferred Ideas

- Батчинг/суммирование уведомлений ("5 новых сообщений") — не нужен, решено не делать
- Кнопка "Отклонить ставку" с уведомлением владельцу — решено не делать
- Онлайн-индикатор / presence для пропуска уведомлений — не нужен
- Email-уведомления — Phase 3

</deferred>

---

*Phase: 02-telegram-notifications*
*Context gathered: 2026-03-28*
