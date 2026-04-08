# Phase 1: Стабилизация - Research

**Researched:** 2026-03-22
**Domain:** Supabase RLS, React navigation, end-to-end deal pipeline
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Миграции**
- Канонический набор: `migrations/` в корне проекта (содержит 01-21)
- Migration 21 (`replace_inn_with_userid`) уже применена в production — `shipperInn` хранит `auth.uid()::text`
- Migrations 01-20 применялись вручную через Supabase dashboard (Supabase CLI отслеживает только `check_schema`)
- Необходимо проверить что все 01-20 применены прежде чем включать RLS

**RLS Политики**

RLS сейчас отключён на `requests`, `bids`, `profiles`, `messages` — политики определены но не работают.

requests:
- SELECT: все авторизованные пользователи (включая demo-роль) — это биржа заявок
- INSERT: все авторизованные (кроме demo)
- UPDATE: только автор (`shipperInn = auth.uid()::text`)
- DELETE: не нужен (мягкое удаление через статус)

bids:
- SELECT: автор bid (owner) + владелец заявки (shipper, чей `shipperInn = auth.uid()::text`)
- INSERT: авторизованные пользователи с ролью owner
- UPDATE: автор bid + владелец заявки (уже есть в migration 21)

profiles:
- SELECT: все авторизованные пользователи — app.jsx загружает все профили для отображения имён/компаний в чате и карточках заявок. Раскрытие phone/company контролируется на уровне UI через `bid.contacts_revealed`, не через RLS.
- UPDATE: пользователь обновляет только свой профиль (`id = auth.uid()`)
- INSERT: не нужен (создаётся триггером `on_auth_user_created`)

messages:
- SELECT: участники сделки (owner + shipper по bid) + admin
- INSERT: участники сделки (уже есть)

После написания всех политик — включить `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` на всех 4 таблицах.

**UserDashboard кнопки**
- "Create request" → `setView('create')`
- "My requests" → `setView('my-requests')`
- "My bids" → `setView('my-bids')` (нужно добавить этот view в app.jsx, подключив `MyBidsView.jsx`)
- "Fleet online" → `setView('fleet')` (нужно добавить этот view в app.jsx, подключив `FleetDislocation.jsx`)
- "Documents" → удалить кнопку (нет view, это Phase 6+)
- "Add credit" → удалить кнопку (это Phase 6 — платежи)

**Pipeline тест**
- Пройти полный flow вручную: создать заявку → сделать ставку → открыть чат → согласовать комиссию → раскрыть контакты
- Баги найденные в процессе — фиксим сразу в рамках Phase 1
- Тест на боевом Supabase проекте (xakyjvlxypivrmuehsxl)

**Realtime**
- `requests`, `bids`, `messages` уже в `supabase_realtime` publication
- `profiles` не в publication — добавить: `ALTER PUBLICATION supabase_realtime ADD TABLE profiles`
- После включения RLS — Realtime работает только если есть SELECT-политики (это покрыто выше)

### Claude's Discretion

Нет явно выделенных зон дискреции — все решения зафиксированы.

### Deferred Ideas (OUT OF SCOPE)

- Column-level security для profiles (скрывать phone до оплаты на уровне БД) — текущая архитектура не требует, контролируется на UI
- `Documents` view / раздел документов — нет компонента, Phase 6+
- `Add credit` / пополнение баланса — Phase 6 (платежи)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STAB-02 | Все SQL миграции применены в правильном порядке без конфликтов | Migration audit: два дубликата папки, migration 21 только в anti_railmatch/. Порядок и конфликты задокументированы ниже. |
| STAB-03 | Realtime подписки работают для requests, bids, messages | Подписки уже в publication, profiles нужно добавить. RLS SELECT-политики обязательны для Realtime после включения RLS. |
| STAB-04 | Полный pipeline сделки работает end-to-end (заявка → ставка → чат → комиссия → контакты) | Весь pipeline-код существует в app.jsx. Критический путь: `shipperInn` = `auth.uid()::text` (migration 21), RLS на bids должен разрешить SELECT обоим участникам. |
| STAB-05 | RLS policies корректны — пользователь видит только свои данные там где нужно | Текущее состояние: RLS disabled на всех 4 таблицах. Политики определены в миграциях но не активны. Conflict с migration 20. |
| STAB-06 | Быстрые действия в UserDashboard ведут на реальные разделы | UserDashboard.jsx:93-128 — 6 actions с console.log. MyBidsView.jsx и FleetDislocation.jsx существуют, не импортированы в app.jsx. |
</phase_requirements>

## Summary

Phase 1 — чисто инфраструктурная. Весь production-код уже написан: компоненты существуют, pipeline-логика реализована, миграции написаны. Задача — включить то, что отключено (RLS), подключить то, что не подключено (2 компонента), и пройти e2e-проверку.

Главный риск — конфликты RLS-политик между миграциями. Migration 20 (`fix_rls_security.sql`) правит политики без DROP IF EXISTS для всех, migration 21 тоже меняет bids UPDATE policy. При включении RLS важно понять финальное состояние политик, не последовательность их создания.

Второй риск — `bids` SELECT после включения RLS. Shipper должен видеть bids на свои requests. Текущие миграции не содержат явной SELECT-политики для bids с этим условием (только UPDATE). Это нужно создать.

**Primary recommendation:** Писать финальные RLS-политики как единый SQL-скрипт (migration 22) с `DROP POLICY IF EXISTS` перед каждой политикой, затем `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Это исключит конфликты с предыдущими миграциями.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase JS | уже в проекте | RLS включается через SQL, клиент не меняется | Уже используется |
| React | уже в проекте | Добавление views и wire-up компонентов | Уже используется |

Нет новых зависимостей для этой фазы.

## Architecture Patterns

### Существующий паттерн рендеринга views

```jsx
// app.jsx — все views рендерятся условно
{view === 'catalog' && <CatalogComponent ... />}
{view === 'my-requests' && <MyRequestsView ... />}
{view === 'analytics' && <AnalyticsDashboard ... />}
// Добавить по той же схеме:
{view === 'my-bids' && <MyBidsView bids={bids} requests={requests} userId={sbUser?.id} userRole={userProfile?.role} onChat={...} setView={setView} onAiCreate={...} />}
{view === 'fleet' && <FleetDislocation />}
```

### Паттерн RLS для `shipperInn = auth.uid()::text`

Migration 21 заменила `shipperInn` с ИНН-компании на `auth.uid()::text`. Все RLS-условия на requests и bids должны использовать этот паттерн:

```sql
-- requests UPDATE: только автор
CREATE POLICY "Shipper can update own requests" ON public.requests
  FOR UPDATE USING ("shipperInn" = auth.uid()::text);

-- bids SELECT: owner видит свои, shipper видит на свои requests
CREATE POLICY "Bid participants can view bids" ON public.bids
  FOR SELECT USING (
    auth.uid() = "ownerId"
    OR "requestId" IN (
      SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text
    )
  );
```

### Паттерн messages SELECT с участниками сделки

```sql
CREATE POLICY "Deal participants can view messages" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid()::text
    OR sender_id = 'system'
    OR chat_id IN (
      SELECT b.id FROM public.bids b
      WHERE b."ownerId" = auth.uid()
        OR b."requestId" IN (
          SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text
        )
    )
  );
```

### Паттерн передачи setView в UserDashboard

```jsx
// app.jsx — setView уже определён в App, передаётся вниз
{view === 'dashboard' && (
  <UserDashboard
    userProfile={userProfile}
    onLogout={handleLogout}
    setView={setView}  // добавить этот prop
  />
)}
```

```jsx
// UserDashboard.jsx — принять setView и использовать
export default function UserDashboard({ userProfile, onLogout, setView }) {
  // action: () => setView('create')  вместо  action: () => console.log('...')
}
```

### Anti-Patterns to Avoid

- **Включать RLS без финальных DROP + CREATE политик**: если миграции 01, 09, 15, 20 создавали политики с одинаковыми именами без DROP, при включении RLS будут дублирующиеся политики — непредсказуемое поведение.
- **Проверять политики без включения RLS**: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` обязателен — без него политики игнорируются.
- **Добавлять profiles в Realtime до включения RLS на profiles**: RLS без SELECT-политики заблокирует Realtime-события — включать в связке.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Проверка примененных миграций | Кастомная таблица версий | Supabase Dashboard → Database → Migrations tab | Dashboard показывает applied migrations |
| Тест RLS-политик | Unit-тесты на JS | SQL в Supabase SQL editor с `SET LOCAL role = anon` | Прямая проверка в БД быстрее |
| Realtime для profiles | Кастомный polling | `ALTER PUBLICATION supabase_realtime ADD TABLE profiles` | Уже поддержано subscription-кодом в app.jsx |

## Common Pitfalls

### Pitfall 1: Migration 20 конфликт с `inn`-based политиками

**What goes wrong:** Migration 20 (`fix_rls_security.sql`) создаёт bids UPDATE policy через `(SELECT inn FROM public.profiles WHERE id = auth.uid())`, но migration 21 изменила `shipperInn` на `auth.uid()::text`. Если migration 20 применена после 21, UPDATE policy на bids будет работать через `inn`, а не через `auth.uid()::text` — несоответствие с остальными политиками.

**Why it happens:** Migration 20 была написана до migration 21.

**How to avoid:** В migration 22 явно DROP + CREATE все bids/requests UPDATE политики, используя `auth.uid()::text` паттерн. Не полагаться на то что в БД сейчас.

**Warning signs:** bids UPDATE возвращает 0 rows при правильном пользователе.

### Pitfall 2: RLS на `bids` блокирует `profiles` JOIN в `buildChatObject`

**What goes wrong:** `app.jsx:523` — `buildChatObject` делает `profiles.find(p => p.inn === req?.shipperInn)`. После включения RLS на profiles — это клиентский JOIN по уже загруженным данным, RLS не мешает. Но `profiles` SELECT policy должна разрешать видеть все профили, иначе initial fetch вернёт только свой профиль.

**Why it happens:** По умолчанию RLS без SELECT-политики → 0 rows для всех.

**How to avoid:** Убедиться что profiles SELECT policy — `FOR SELECT USING (auth.role() = 'authenticated')` или аналог.

### Pitfall 3: Realtime требует SELECT-политику для filtered subscriptions

**What goes wrong:** После включения RLS на таблицу Realtime-события доходят только если у пользователя есть SELECT-доступ к той строке. Без SELECT-политики на `bids` — owner не получит UPDATE-событие когда shipper изменил bid.

**Why it happens:** Supabase Realtime проверяет RLS при отправке события подписчику.

**How to avoid:** Включать RLS и SELECT-политику одновременно. Тестировать Realtime после включения: создать запись в одной сессии, убедиться что другая сессия получила событие.

### Pitfall 4: `UserDashboard` рендерится на view `'dashboard'`, которого нет в app.jsx

**What goes wrong:** В app.jsx нет `{view === 'dashboard' && <UserDashboard />}`. Компонент, скорее всего, встроен в другой экран или рендерится иначе. Перед добавлением `setView` prop нужно найти где UserDashboard реально рендерится.

**Why it happens:** `view` state в app.jsx (строка 92) не включает `'dashboard'` в список.

**How to avoid:** Найти место рендеринга UserDashboard в app.jsx перед модификацией. Если он рендерится без view-условия — prop setView передаётся напрямую через родительский компонент.

### Pitfall 5: `MyBidsView.jsx` ожидает prop `onAiCreate`

**What goes wrong:** Сигнатура: `MyBidsView({ bids, requests, userId, userRole, onChat, setView, onAiCreate })`. При wire-up в app.jsx нужно передать все props — в частности `onAiCreate`, который уже есть в app.jsx (`setAiCreateData` + `setView('create')`).

**How to avoid:** Передать все обязательные props при добавлении `{view === 'my-bids' && <MyBidsView ... />}`.

## Code Examples

### Migration 22: финальные RLS-политики (рекомендуемый подход)

```sql
-- ============================================================
-- Migration 22: Enable RLS with final policies
-- Canonical state — drops all previous policies and recreates.
-- ============================================================

-- REQUESTS
DROP POLICY IF EXISTS "Requests are viewable by everyone" ON public.requests;
DROP POLICY IF EXISTS "Anyone can view open requests" ON public.requests;
DROP POLICY IF EXISTS "Shippers can insert their own requests" ON public.requests;
DROP POLICY IF EXISTS "Authenticated users can insert requests" ON public.requests;
DROP POLICY IF EXISTS "Shippers can update own requests" ON public.requests;
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;

CREATE POLICY "Authenticated users can view requests" ON public.requests
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert requests" ON public.requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Shipper can update own requests" ON public.requests
  FOR UPDATE USING ("shipperInn" = auth.uid()::text);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- BIDS
DROP POLICY IF EXISTS "Bids are viewable by everyone" ON public.bids;
DROP POLICY IF EXISTS "Owners can insert their own bids" ON public.bids;
DROP POLICY IF EXISTS "Owners and Shippers can update bids" ON public.bids;

CREATE POLICY "Bid participants can view bids" ON public.bids
  FOR SELECT USING (
    auth.uid() = "ownerId"
    OR "requestId" IN (
      SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text
    )
  );

CREATE POLICY "Authenticated users can insert bids" ON public.bids
  FOR INSERT WITH CHECK (auth.uid() = "ownerId");

CREATE POLICY "Bid participants can update bids" ON public.bids
  FOR UPDATE USING (
    auth.uid() = "ownerId"
    OR "requestId" IN (
      SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text
    )
  );

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- MESSAGES
DROP POLICY IF EXISTS "Messages are viewable by chat participants" ON public.messages;
DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;

CREATE POLICY "Deal participants can view messages" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid()::text
    OR sender_id = 'system'
    OR chat_id IN (
      SELECT b.id FROM public.bids b
      WHERE b."ownerId" = auth.uid()
        OR b."requestId" IN (
          SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text
        )
    )
  );

CREATE POLICY "Deal participants can insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid()::text = sender_id OR sender_id = 'system'
  );

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- REALTIME: add profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```

### Wire-up MyBidsView в app.jsx

```jsx
// Добавить import в начало app.jsx:
import MyBidsView from './components/MyBidsView';
import FleetDislocation from './components/FleetDislocation';

// Добавить в render-секцию рядом с другими view-блоками:
{view === 'my-bids' && (
  <MyBidsView
    bids={bids}
    requests={requests}
    userId={sbUser?.id}
    userRole={userProfile?.role}
    onChat={(chat) => { setActiveChat(chat); setView('chat'); }}
    setView={setView}
    onAiCreate={(parsed) => { setAiCreateData(parsed); setView('create'); }}
  />
)}

{view === 'fleet' && <FleetDislocation />}
```

### Передача setView в UserDashboard

Нужно найти место рендеринга UserDashboard в app.jsx (поиск по `<UserDashboard`) и добавить `setView={setView}`. В самом компоненте заменить `action: () => console.log(...)` на:

```jsx
// UserDashboard.jsx
export default function UserDashboard({ userProfile, onLogout, setView }) {
  // shipper actions:
  action: () => setView('create')       // Create request
  action: () => setView('my-requests')  // My requests
  // удалить кнопку Documents

  // owner actions:
  action: () => setView('fleet')        // Fleet online
  action: () => setView('my-bids')      // My bids
  // удалить кнопку Add credit
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `shipperInn` = ИНН компании | `shipperInn` = `auth.uid()::text` | Migration 21 | RLS работает через `auth.uid()`, не через JOIN к profiles |
| RLS disabled, все видят всё | RLS enabled с точечными политиками | Phase 1 (pending) | Shipper не видит чужие bids, owner не может редактировать чужую заявку |
| UserDashboard buttons → console.log | buttons → setView() | Phase 1 (pending) | Реальная навигация |

**Deprecated/outdated:**
- `inn`-based UPDATE политики из migration 20: заменяются в migration 22 на `auth.uid()::text` паттерн
- `profiles` SELECT USING (true) из migration 01: заменяется на `auth.role() = 'authenticated'`

## Open Questions

1. **Где рендерится UserDashboard в app.jsx?**
   - Что мы знаем: `view` state не содержит `'dashboard'`, компонент существует, никакого `{view === 'dashboard' && <UserDashboard />}` в найденных фрагментах нет
   - Что неясно: рендерится ли он как часть landing screen, app screen без view-условия, или через другой механизм
   - Recommendation: Перед планированием задачи STAB-06 найти в app.jsx все вхождения `<UserDashboard` через grep

2. **Все ли миграции 01-20 реально применены в production?**
   - Что мы знаем: применялись вручную через dashboard, нет автоматического трекинга
   - Что неясно: конкретное текущее состояние БД
   - Recommendation: В плане предусмотреть задачу аудита — проверить наличие таблиц, колонок и политик перед применением migration 22

3. **Нужна ли SELECT-политика на `bids` для demo-роли?**
   - Что мы знаем: demo не имеет `auth.uid()` (создаётся как `{ role: 'demo' }` в памяти, без Supabase auth)
   - Что неясно: как demo получает bids сейчас без RLS
   - Recommendation: Demo-режим загружает только requests (app.jsx:420-427), bids не загружает — проблемы нет

## Validation Architecture

Nyquist validation не настроен (`.planning/config.json` не существует) — раздел включён по умолчанию.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Ручное тестирование в браузере + Supabase SQL editor |
| Config file | none |
| Quick run command | Открыть production URL, войти как shipper, войти как owner |
| Full suite command | Пройти полный pipeline: заявка → ставка → чат → комиссия → контакты |

Автоматизированных тестов в проекте нет. Природа Phase 1 (SQL-политики, Realtime, E2E flow) требует ручного тестирования на боевом Supabase.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Verification | File Exists? |
|--------|----------|-----------|--------------|-------------|
| STAB-02 | Миграции применены без конфликтов | manual | Проверить в Supabase Dashboard: таблицы, колонки из migration 12 (contacts_revealed), migration 13 (violation_points), migration 14 (trigger on_auth_user_created) | n/a |
| STAB-03 | Realtime работает для requests/bids/messages | manual | Открыть два браузера, создать request в первом, убедиться что второй получил событие без refresh | n/a |
| STAB-04 | E2E pipeline работает | manual | Полный сценарий: создать заявку (shipper) → сделать ставку (owner) → открыть чат → согласовать комиссию → оплатить → contacts_revealed = true | n/a |
| STAB-05 | RLS корректен | manual | SQL-проверки в editor: `SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claims = '{"sub":"UUID_ДРУГОГО_ПОЛЬЗОВАТЕЛЯ"}'; SELECT * FROM bids;` | n/a |
| STAB-06 | Кнопки UserDashboard работают | manual | Нажать каждую кнопку, убедиться что view меняется на правильный | n/a |

### Wave 0 Gaps

- [ ] Нет тестовой инфраструктуры — Phase 1 полностью ручная верификация через Supabase Dashboard и браузер

## Sources

### Primary (HIGH confidence)

- Прямое чтение исходного кода: `app.jsx`, `components/UserDashboard.jsx`, `components/MyBidsView.jsx`, `components/FleetDislocation.jsx`
- Прямое чтение миграций: все файлы в `migrations/` и `anti_railmatch/migrations/`
- `.planning/phases/01-stabilizaciya/01-CONTEXT.md` — зафиксированные решения
- `.planning/REQUIREMENTS.md` — требования STAB-02..06

### Secondary (MEDIUM confidence)

- Supabase RLS + Realtime поведение: основано на знании архитектуры Supabase (RLS применяется к Realtime-событиям), не проверено через Context7 — для этого проекта достаточно, т.к. это стандартное поведение платформы.

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — нет новых зависимостей, только существующий код
- Architecture: HIGH — все паттерны взяты из существующего кода проекта
- Pitfalls: HIGH — выявлены из прямого анализа конфликтов между миграциями

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (стабильная платформа)
