# Phase 2: Telegram уведомления - Research

**Researched:** 2026-03-28
**Domain:** Telegram Bot API via Supabase Edge Functions, React UI (accept bid), app.jsx integration
**Confidence:** HIGH

## Summary

Инфраструктура для Telegram-уведомлений полностью написана и находится в репозитории: Edge Functions `telegram-notify`, `telegram-bot`, `verify-linking-code` существуют, schema (migration 13) применена, UI привязки аккаунта в ProfileSettings готов. Статус деплоя неизвестен — необходимо задеплоить все три функции через `supabase functions deploy`.

Из четырёх требований два уже выполнены (NOTIF-01, NOTIF-04). Два требуют точечных изменений в коде: NOTIF-02 — добавить один вызов `sendNotification` в конец `handleSendMessage`; NOTIF-03 — добавить новую функцию `handleAcceptBid` и кнопку в MyRequestsView. `handleConfirmDeal` — это НЕ принятие ставки, это подтверждение условий сделки на следующем этапе; не путать и не переиспользовать.

**Primary recommendation:** Сначала деплой функций и smoke-тест привязки, затем минимальные правки кода для NOTIF-02 и NOTIF-03.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Уведомления о сообщениях (NOTIF-02)**
- Каждое отправленное сообщение → отдельный `sendNotification` партнёру (нет throttle, нет cooldown)
- Системные сообщения (вставляются автоматически кодом) — тоже триггерят уведомление получателю
- Онлайн-статус не учитывается — уведомление отправляется всегда
- Текст уведомления: фиксированный "у вас новое сообщение" без содержимого сообщения
- Получатель = партнёр по bid (не отправитель)

**Принятие ставки (NOTIF-03 + новый UI)**
- В MyRequestsView для pending bids: кнопка "Принять ставку" вместо "Открыть чат"
- После нажатия: bid.status = 'accepted', кнопка меняется на "Открыть чат", переход в чат
- Owner получает Telegram-уведомление "ваша ставка принята"
- Кнопки "Отклонить ставку" нет — не нужна
- Несколько bids на одну заявку могут быть accepted одновременно — заявка остаётся открытой пока не раскрыты контакты хотя бы по одной из них
- Кнопка "Принять ставку" только в MyRequestsView, не в окне чата

**Деплой и инфраструктура (NOTIF-01..04)**
- `TELEGRAM_BOT_TOKEN` уже добавлен в Supabase secrets
- Статус деплоя `telegram-notify` и `telegram-bot` неизвестен — нужно проверить и задеплоить через Supabase CLI
- Telegram-привязка аккаунта (`/start TOKEN` в боте) не тестировалась — проверить работоспособность в рамках фазы
- Деплой: `supabase functions deploy` — Claude пробует через CLI

**Уже реализовано (не переписывать)**
- NOTIF-01: `sendNotification` на новую ставку уже есть — `app.jsx:606`
- NOTIF-04: `sendNotification` на раскрытие контактов уже есть — `app.jsx:976`
- `telegram-notify` Edge Function написана и готова — `supabase/functions/telegram-notify/index.ts`
- Telegram-привязка: schema в migration 13, `telegram-bot` и `verify-linking-code` функции написаны

### Claude's Discretion

- Порядок деплоя функций (какую первой)
- Конкретный текст уведомлений для NOTIF-02 и NOTIF-03 (в рамках "фиксированного" требования)
- Технические детали реализации `handleAcceptBid`

### Deferred Ideas (OUT OF SCOPE)

- Батчинг/суммирование уведомлений ("5 новых сообщений")
- Кнопка "Отклонить ставку" с уведомлением владельцу
- Онлайн-индикатор / presence для пропуска уведомлений
- Email-уведомления — Phase 3
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTIF-01 | Грузоотправитель получает Telegram-уведомление когда владелец откликнулся на заявку | ALREADY DONE: `sendNotification` at `app.jsx:606` fires after bid insert. No code change needed — only deployment verification. |
| NOTIF-02 | Пользователь получает уведомление о новом сообщении в чате сделки | MISSING: `handleSendMessage` at `app.jsx:724-734` inserts message but never calls `sendNotification`. Need to add one call after successful insert, with partnerId derived from `activeChat`. |
| NOTIF-03 | Владелец получает уведомление когда ставка принята | MISSING: No bid acceptance UI or handler exists. `handleConfirmDeal` is deal-terms confirmation (different flow). Need new `handleAcceptBid(bidId)` + button in MyRequestsView for pending bids (shipper-only). |
| NOTIF-04 | Обе стороны получают уведомление при раскрытии контактов | ALREADY DONE: `sendNotification` at `app.jsx:976` fires on commission payment that reveals contacts. No code change needed — only deployment verification. |
</phase_requirements>

---

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Supabase Edge Functions (Deno) | `std@0.168.0` | Telegram API calls, linking token verification | Already in use — `telegram-notify`, `telegram-bot`, `verify-linking-code` all written |
| Telegram Bot API | `sendMessage` endpoint | Deliver notifications to users | Only official channel; `telegram-notify` already wraps it |
| `supabase.functions.invoke()` | SDK v2 | Call Edge Functions from React client | Pattern established in `sendNotification` at `app.jsx:140` |
| Supabase CLI | latest | Deploy Edge Functions | Required; available in project environment |

### No New Dependencies Required

All dependencies are already in place. This phase adds no new npm packages or Deno imports.

**Deploy command:**
```bash
supabase functions deploy telegram-notify
supabase functions deploy telegram-bot
supabase functions deploy verify-linking-code
```

---

## Architecture Patterns

### Established Pattern: sendNotification (fire-and-forget)

```javascript
// app.jsx:140 — DO NOT CHANGE THIS FUNCTION
const sendNotification = useCallback(async (toUserId, subject, bodyText) => {
    if (!toUserId) return;
    supabase.functions.invoke('notify', { body: { userId: toUserId, subject, bodyText } })
        .catch(e => console.warn('Email notification skipped:', e));
    supabase.functions.invoke('telegram-notify', { body: { user_id: toUserId, message: bodyText } })
        .catch(e => console.warn('TG notification skipped:', e));
}, []);
```

Calls are non-blocking (`.catch` swallows errors). This is intentional — notifications must never block UI interactions.

### Established Pattern: partnerId Resolution

```javascript
// Used in handleConfirmDeal (app.jsx:783), handleCommissionPayment (app.jsx:971)
const partnerId = isShipper ? bid.ownerId : bid.shipperInn;
// or equivalently:
const partnerId = userProfile.role === 'shipper' ? bid.ownerId : bid.shipperInn;
```

For `handleSendMessage` context: sender's role is `userProfile.role`; `activeChat` contains both `ownerId` and `shipperInn`.

### Pattern: System Messages Also Trigger Notification

Per locked decisions: system messages inserted by code also trigger notification to the recipient. When `sender_id: 'system'` is inserted by `handleConfirmDeal` or `handleCommissionPayment`, the notification call already follows in the same function. For `handleSendMessage` (user-sent messages), adding `sendNotification` after successful insert covers the user-message case. System messages inserted in other handlers that don't have `sendNotification` are not in scope for this phase.

### New Pattern: handleAcceptBid

New function to add in `app.jsx` (after `handleSendMessage`). Key properties:
- Shipper-only action (guard: `userProfile.role !== 'shipper'`)
- Sets `bid.status = 'accepted'` via supabase update
- Calls `sendNotification(bid.ownerId, subject, body)` — owner is always `bid.ownerId`
- Updates local state: `setBids(prev => prev.map(...))`
- Navigates to chat: `setActiveChat(buildChatObject(updatedBid, req, profiles))` + `setView('chat')`

### MyRequestsView: Button Mutation for pending Bids

Currently at `components/MyRequestsView.jsx:357-360`, there is ONE button per bid in the "my-responses" tab (`activeTab === 'my-responses'`):

```jsx
// Current (both statuses use same button, different text):
<button onClick={() => onChat(bid)}>
    {bid.status === 'accepted' ? 'Открыть чат' : 'Начать обсуждение'}
</button>
```

Per locked decisions: the "my-responses" tab shows owner's own bids (bids the owner submitted). The "Принять ставку" button must appear in the **active requests tab** (`activeTab === 'active'`), in the incoming bids list under each request (where shipper sees others' bids on their requests). The button replaces the existing navigation/action in that context.

Looking at the active tab bid rendering (`MyRequestsView.jsx:268-323`): incoming bids on shipper's requests are rendered in a sorted list but currently have no action button — only display. The "Принять ставку" button goes here, alongside passing `onAcceptBid` as a prop.

**Prop signature change for MyRequestsView:**
```jsx
// Add onAcceptBid prop:
export default function MyRequestsView({ ..., onAcceptBid })
// Call site in app.jsx:
onAcceptBid={(bidId) => handleAcceptBid(bidId)}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Telegram message delivery | Custom HTTP fetch in React | `sendNotification()` → `telegram-notify` Edge Function | Already abstracts auth, silent skip, error handling |
| No telegram_id graceful degradation | Null check in React | `telegram-notify` already returns `{ skipped: true }` silently | Edge function handles it server-side |
| partnerId resolution | New logic | `userProfile.role === 'shipper' ? bid.ownerId : bid.shipperInn` | Pattern verified in 4+ places in app.jsx |

---

## Common Pitfalls

### Pitfall 1: Confusing handleConfirmDeal with handleAcceptBid

**What goes wrong:** Reusing `handleConfirmDeal` for bid acceptance, or wiring `onAccept={handleConfirmDeal}` as the accept-bid action.
**Why it happens:** `handleConfirmDeal` is passed as `onAccept` in MyRequestsView props, which sounds like it could mean "accept bid". It does not — it sets `shipper_confirmed: true` for the deal terms confirmation step, which comes *after* bid is accepted.
**How to avoid:** Create `handleAcceptBid(bidId)` as a separate function. Bid status flow: `pending` → `accepted` (new, this phase) → `commission_pending` (handleConfirmDeal territory).
**Warning signs:** If the handler queries `shipper_confirmed` or `owner_confirmed`, it is the wrong function.

### Pitfall 2: handleSendMessage — activeChat availability for partnerId

**What goes wrong:** `handleSendMessage(chatId, text)` receives only `chatId` and `text` — it does not receive the bid object. Need `activeChat` or `bids` state to resolve partnerId.
**Why it happens:** The function signature predates the notification requirement.
**How to avoid:** Derive partnerId inside `handleSendMessage` using `activeChat` (already in scope as component state) or look up bid from `bids` array by `chatId`. `activeChat` is the direct source — it contains `ownerId` and `shipperInn`. The sender is `sbUser.id`; partner is the other field.
**Warning signs:** If code tries to pass partnerId as a parameter to `handleSendMessage`, the signature is being changed unnecessarily.

### Pitfall 3: Sending notification to self

**What goes wrong:** Using the wrong side of the `ownerId`/`shipperInn` pair, notifying the sender instead of the recipient.
**Why it happens:** The `partnerId` formula depends on the current user's role. For `handleSendMessage`: sender is `sbUser.id`. If `userProfile.role === 'shipper'`, shipper is sending, partner is owner → `partnerId = activeChat.ownerId`. If role is `owner`, owner is sending, partner is shipper → `partnerId = activeChat.shipperInn`.
**How to avoid:** Test with both roles.

### Pitfall 4: Deploying functions without verifying TELEGRAM_BOT_TOKEN

**What goes wrong:** Functions deploy but notifications silently fail because the bot token isn't picked up.
**Why it happens:** Supabase secrets must be set *before* first invocation, but the function reads it at runtime — deploy succeeds regardless.
**How to avoid:** After deploying, test `telegram-notify` directly via `supabase functions invoke telegram-notify --body '{"user_id":"<uuid>","message":"test"}'` with a user who has telegram_id set. Confirm `{ ok: true }` response.
**Warning signs:** Function returns `200` but with `{ skipped: true, reason: "no telegram_id" }` — this means the user_id lookup found no telegram_id, not a token problem. A real token problem shows in the Telegram API response: `{ ok: false, ... }`.

### Pitfall 5: verify-linking-code requires BOT_WEBHOOK_SECRET

**What goes wrong:** `verify-linking-code` returns 401 Unauthorized on all requests.
**Why it happens:** The function checks `x-bot-secret` header against `BOT_WEBHOOK_SECRET` env var (see `verify-linking-code/index.ts:7,17`). This secret may not be set in Supabase.
**How to avoid:** Check if `BOT_WEBHOOK_SECRET` is set in Supabase secrets. If not, it needs to be added. Note: `verify-linking-code` is called by `telegram-bot`, not directly by the frontend — it's an inter-function call. The flow is: user clicks "Generate token" in ProfileSettings → token stored in DB → user sends `/start TOKEN` to bot → `telegram-bot` handler updates profile directly (does NOT call `verify-linking-code`). `verify-linking-code` appears to be an alternative web-based flow. For Phase 2, the bot-based `/start TOKEN` flow is what matters — it updates profiles directly without `verify-linking-code`.

---

## Code Examples

### NOTIF-02: Add sendNotification in handleSendMessage

```javascript
// app.jsx — inside handleSendMessage, after line 730 (after successful insert)
// Location: after `if (error) throw error;`
const partnerId = userProfile.role === 'shipper'
    ? activeChat?.ownerId
    : activeChat?.shipperInn;
if (partnerId && partnerId !== sbUser.id) {
    sendNotification(partnerId, 'Новое сообщение — RailMatch', 'У вас новое сообщение на платформе RailMatch.\n\nОткройте платформу, чтобы ответить.');
}
```

Note: `activeChat` is in scope as component state — `handleSendMessage` is defined inside the App component.

### NOTIF-03: handleAcceptBid function

```javascript
// app.jsx — add after handleSendMessage
const handleAcceptBid = async (bidId) => {
    if (!sbUser || userProfile?.role !== 'shipper') return;

    const bid = bids.find(b => b.id === bidId);
    if (!bid) return;

    const { data: updatedBid, error } = await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', bidId)
        .select()
        .single();

    if (error) {
        showToast('Ошибка при принятии ставки', 'error');
        return;
    }

    setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'accepted' } : b));

    sendNotification(
        bid.ownerId,
        'Ваша ставка принята — RailMatch',
        `Компания «${userProfile.company}» приняла вашу ставку.\n\nОткройте платформу, чтобы перейти в чат.`
    );

    const req = requests.find(r => r.id === bid.requestId);
    setActiveChat(buildChatObject(updatedBid, req, profiles));
    setView('chat');
};
```

### NOTIF-03: MyRequestsView — "Принять ставку" button

In the incoming bids list (activeTab === 'active' section, `MyRequestsView.jsx:268-323`), add a button for each bid with `status === 'pending'`:

```jsx
// Add onAcceptBid to props destructuring at line 5
export default function MyRequestsView({ ..., onAcceptBid }) {

// In the bid card render (around line 275), add action button:
{bid.status === 'pending' && onAcceptBid && (
    <button
        onClick={() => onAcceptBid(bid.id)}
        className="mt-4 w-full px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all active:scale-95"
    >
        Принять ставку
    </button>
)}
{bid.status === 'accepted' && (
    <button
        onClick={() => onChat(bid)}
        className="mt-4 w-full px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all active:scale-95"
    >
        Открыть чат
    </button>
)}
```

Pass the prop at `app.jsx:1517-1534`:
```jsx
<MyRequestsView
    ...
    onAcceptBid={(bidId) => handleAcceptBid(bidId)}
/>
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| No bid acceptance step | `pending` → `accepted` transition with notification | Shipper can now explicitly accept a bid before deal terms negotiation |
| `handleConfirmDeal` = "accept bid" (conflation) | `handleAcceptBid` (new) = bid acceptance; `handleConfirmDeal` = deal terms confirmation | Cleaner separation of pipeline stages |

**Bid status flow (updated):**
```
pending → accepted (new, this phase) → commission_pending (handleConfirmDeal) → contacts_revealed
```

---

## Deployment Checklist

These are facts, not tasks — for planner reference:

1. `telegram-notify` — written, deployment status unknown
2. `telegram-bot` — written, deployment status unknown; requires Telegram webhook to be set
3. `verify-linking-code` — written, deployment status unknown; requires `BOT_WEBHOOK_SECRET` secret
4. `TELEGRAM_BOT_TOKEN` — confirmed set in Supabase secrets
5. Telegram webhook registration: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNCTION_URL>` — must be called once after `telegram-bot` is deployed
6. ProfileSettings UI for account linking — already implemented, no changes needed
7. Migration 13 — already applied (telegram_id, telegram_link_token fields exist)

---

## Open Questions

1. **Is `BOT_WEBHOOK_SECRET` set in Supabase secrets?**
   - What we know: `verify-linking-code` requires it; if missing, that function returns 401
   - What's unclear: Whether it was added alongside `TELEGRAM_BOT_TOKEN`
   - Recommendation: Check during deployment task; if missing, generate and add a random value, then set same value in `telegram-bot` if it calls `verify-linking-code` (it does not — `telegram-bot` updates profiles directly, so `verify-linking-code` is unused by the main flow)

2. **Has Telegram webhook been set for `telegram-bot`?**
   - What we know: `telegram-bot` is an HTTP endpoint; Telegram pushes updates to it via webhook
   - What's unclear: Whether `setWebhook` was called after any previous deploy attempt
   - Recommendation: Call `setWebhook` as part of deployment task regardless (idempotent)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual smoke testing (no automated test framework detected in project) |
| Config file | none |
| Quick run command | Manual: send a bid, check Telegram |
| Full suite command | Manual: run full pipeline (bid → accept → chat message → contacts reveal) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOTIF-01 | Shipper receives TG notification on new bid | smoke/manual | n/a — fire-and-forget, requires live Telegram | ❌ Wave 0 |
| NOTIF-02 | Participant receives TG notification on new chat message | smoke/manual | n/a — requires live Telegram and linked account | ❌ Wave 0 |
| NOTIF-03 | Owner receives TG notification when bid accepted; "Принять ставку" button appears for shipper | smoke/manual | n/a — requires live Telegram | ❌ Wave 0 |
| NOTIF-04 | Both parties receive TG notification on contacts reveal | smoke/manual | n/a — fire-and-forget, requires live Telegram | ❌ Wave 0 |

### Sampling Rate

- **Per task:** Code review — verify `sendNotification` call present at correct location
- **Per wave merge:** Full pipeline smoke test with real Telegram account
- **Phase gate:** All 4 notification events confirmed delivered to Telegram before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No automated tests applicable — all validation is manual smoke testing with a real Telegram-linked account
- [ ] Deployment of `telegram-notify`, `telegram-bot`, `verify-linking-code` must happen in Wave 0 (or as first task of Wave 1) before any code changes are testable
- [ ] Telegram webhook registration (`setWebhook`) must happen once after `telegram-bot` is deployed

---

## Sources

### Primary (HIGH confidence)

- Direct code reading: `supabase/functions/telegram-notify/index.ts` — full implementation verified
- Direct code reading: `supabase/functions/telegram-bot/index.ts` — `/start TOKEN` flow verified
- Direct code reading: `supabase/functions/verify-linking-code/index.ts` — `BOT_WEBHOOK_SECRET` requirement verified
- Direct code reading: `app.jsx:140` — `sendNotification` signature and behavior
- Direct code reading: `app.jsx:590-616` — NOTIF-01 implementation confirmed
- Direct code reading: `app.jsx:618-735` — `handleSendMessage` — confirmed no `sendNotification` call
- Direct code reading: `app.jsx:765-823` — `handleConfirmDeal` — confirmed this is NOT bid acceptance
- Direct code reading: `app.jsx:960-983` — NOTIF-04 implementation confirmed
- Direct code reading: `components/MyRequestsView.jsx:5,357-360` — prop signature and existing button
- Direct code reading: `migrations/13_telegram_integration.sql` — schema confirmed applied
- Direct code reading: `components/ProfileSettings.jsx:44-61` — account linking UI confirmed

### Secondary (MEDIUM confidence)

- CONTEXT.md decisions — user decisions verified against actual code

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all code verified by direct read
- Architecture patterns: HIGH — partnerId pattern appears in 4+ locations, sendNotification verified
- Pitfalls: HIGH — BOT_WEBHOOK_SECRET pitfall confirmed by reading verify-linking-code source; confusing handleConfirmDeal confirmed by reading that function
- Deployment: MEDIUM — functions exist in repo but deploy status unverified (requires CLI check)

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable codebase, no external API changes expected)
