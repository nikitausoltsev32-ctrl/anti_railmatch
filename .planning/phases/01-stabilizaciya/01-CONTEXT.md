# Phase 1: Стабилизация - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Исправить критическую инфраструктуру: применить недостающие миграции, включить RLS на core таблицах с полным набором политик, подключить FleetDislocation и MyBidsView в app.jsx, починить кнопки UserDashboard, добавить profiles в Realtime publication, и пройти полный pipeline end-to-end (заявка → ставка → чат → комиссия → контакты) с фиксом найденных багов.

</domain>

<decisions>
## Implementation Decisions

### Миграции

- Канонический набор: `migrations/` в корне проекта (содержит 01-21)
- Migration 21 (`replace_inn_with_userid`) уже применена в production — `shipperInn` хранит `auth.uid()::text`
- Migrations 01-20 применялись вручную через Supabase dashboard (Supabase CLI отслеживает только `check_schema`)
- Необходимо проверить что все 01-20 применены прежде чем включать RLS

### RLS Политики

RLS сейчас отключён на `requests`, `bids`, `profiles`, `messages` — политики определены но не работают.

**requests:**
- SELECT: все авторизованные пользователи (включая demo-роль) — это биржа заявок
- INSERT: все авторизованные (кроме demo)
- UPDATE: только автор (`shipperInn = auth.uid()::text`)
- DELETE: не нужен (мягкое удаление через статус)

**bids:**
- SELECT: автор bid (owner) + владелец заявки (shipper, чей `shipperInn = auth.uid()::text`)
- INSERT: авторизованные пользователи с ролью owner
- UPDATE: автор bid + владелец заявки (уже есть в migration 21)

**profiles:**
- SELECT: все авторизованные пользователи — app.jsx загружает все профили для отображения имён/компаний в чате и карточках заявок. Раскрытие phone/company контролируется на уровне UI через `bid.contacts_revealed`, не через RLS.
- UPDATE: пользователь обновляет только свой профиль (`id = auth.uid()`)
- INSERT: не нужен (создаётся триггером `on_auth_user_created`)

**messages:**
- SELECT: участники сделки (owner + shipper по bid) + admin
- INSERT: участники сделки (уже есть)

После написания всех политик — включить `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` на всех 4 таблицах.

### UserDashboard кнопки

6 кнопок сейчас вызывают `console.log`. Правила:
- "Create request" → `setView('create')`
- "My requests" → `setView('my-requests')`
- "My bids" → `setView('my-bids')` (нужно добавить этот view в app.jsx, подключив `MyBidsView.jsx`)
- "Fleet online" → `setView('fleet')` (нужно добавить этот view в app.jsx, подключив `FleetDislocation.jsx`)
- "Documents" → удалить кнопку (нет view, это Phase 6+)
- "Add credit" → удалить кнопку (это Phase 6 — платежи)

`setView` принимает строку, передаётся в `UserDashboard` как prop (или через callback).

### Pipeline тест

- Пройти полный flow вручную: создать заявку → сделать ставку → открыть чат → согласовать комиссию → раскрыть контакты
- Баги найденные в процессе — фиксим сразу в рамках Phase 1
- Тест на боевом Supabase проекте (xakyjvlxypivrmuehsxl)

### Realtime

- `requests`, `bids`, `messages` уже в `supabase_realtime` publication ✓
- `profiles` не в publication — добавить: `ALTER PUBLICATION supabase_realtime ADD TABLE profiles`
- После включения RLS — Realtime работает только если есть SELECT-политики (это покрыто выше)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `setView(string)` в `app.jsx:92` — state для навигации между разделами
- `MyBidsView.jsx` — компонент существует, не подключён в app.jsx
- `FleetDislocation.jsx` — компонент существует, не подключён в app.jsx
- `bid.contacts_revealed` — флаг раскрытия контактов, управляется на уровне UI

### Established Patterns
- Все views рендерятся условно в app.jsx через `{view === 'X' && <Component />}`
- Навигация через `setView` передаётся в компоненты как prop или вызывается напрямую
- Политики RLS в migration 21 уже используют `shipperInn = auth.uid()::text` паттерн

### Integration Points
- `UserDashboard.jsx:93-128` — 6 action кнопок, нужно заменить `console.log` на `setView`
- `app.jsx` — добавить рендер `my-bids` и `fleet` views по аналогии с существующими
- Supabase migration system — применять через dashboard SQL editor (не CLI)

</code_context>

<specifics>
## Specific Ideas

- Проверить что migration 20 (`fix_rls_security.sql`) не конфликтует с новыми политиками — она тоже правит RLS
- При включении RLS на `bids` убедиться что Shipper видит bids на своих requests (нужен JOIN через `requestId → requests.shipperInn`)

</specifics>

<deferred>
## Deferred Ideas

- Column-level security для profiles (скрывать phone до оплаты на уровне БД) — текущая архитектура не требует, контролируется на UI
- `Documents` view / раздел документов — нет компонента, Phase 6+
- `Add credit` / пополнение баланса — Phase 6 (платежи)

</deferred>

---

*Phase: 01-stabilizaciya*
*Context gathered: 2026-03-22*
