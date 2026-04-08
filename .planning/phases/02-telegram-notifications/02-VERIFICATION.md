---
phase: 02-telegram-notifications
verified: 2026-03-28T12:00:00Z
status: gaps_found
score: 3.5/4 requirements verified
re_verification: false
gaps:
  - truth: "Both parties receive Telegram message when contacts are revealed (NOTIF-04)"
    status: partial
    reason: "handleCommissionPayment sends sendNotification only to partnerId when willReveal=true. The payer (current user) receives no Telegram notification. Requirement explicitly states 'обе стороны'."
    artifacts:
      - path: "app.jsx"
        issue: "handleCommissionPayment around line 1013-1022: sendNotification called only for partnerId, not for sbUser.id when contacts are revealed"
    missing:
      - "Add sendNotification(sbUser.id, ...) call inside the willReveal block so the payer also receives a Telegram notification confirming contacts are open"
human_verification:
  - test: "NOTIF-01 — Owner submits bid, shipper receives Telegram message"
    expected: "Shipper receives 'Компания X откликнулась на вашу заявку...' in Telegram"
    why_human: "Telegram delivery requires live external account and deployed Edge Function"
  - test: "NOTIF-02 — Send chat message, other party receives Telegram message"
    expected: "Recipient (not sender) receives 'У вас новое сообщение на платформе RailMatch.' in Telegram"
    why_human: "Telegram delivery requires live external accounts"
  - test: "NOTIF-03 — Shipper clicks 'Принять ставку', owner receives Telegram message"
    expected: "Owner receives 'Компания X приняла вашу ставку.' in Telegram; app navigates to chat"
    why_human: "Telegram delivery requires live external accounts"
  - test: "NOTIF-04 — Contacts revealed, both parties receive Telegram message"
    expected: "Both shipper AND owner receive Telegram notification. Currently code sends only to partner, not payer."
    why_human: "Requires live accounts; also gap must be fixed before this test can pass"
---

# Phase 02: Telegram Notifications Verification Report

**Phase Goal:** Пользователи получают Telegram-уведомления о ключевых событиях своих сделок
**Verified:** 2026-03-28T12:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | NOTIF-01: Shipper receives Telegram when owner submits bid | VERIFIED (code) / NEEDS HUMAN (delivery) | `app.jsx:606-610` — `sendNotification(shipperProfile.id, ...)` called after bid insert in handleSubmitBid |
| 2 | NOTIF-02: Chat participant receives Telegram when partner sends message | VERIFIED | `app.jsx:732-741` — `sendNotification(partnerId, ...)` after successful messages insert with self-guard |
| 3 | NOTIF-03: Owner receives Telegram when shipper clicks 'Принять ставку' | VERIFIED | `app.jsx:748-777` handleAcceptBid: updates bid status, calls `sendNotification(bid.ownerId, ...)`, navigates to chat |
| 4 | NOTIF-04: Both parties receive Telegram when contacts revealed | PARTIAL FAIL | `app.jsx:1013-1022` — only `partnerId` notified; payer (sbUser.id) not notified |
| 5 | 'Принять ставку' button shown on pending bids, 'Открыть чат' on accepted | VERIFIED | `components/MyRequestsView.jsx:290-305` — conditional rendering correct |
| 6 | telegram-notify Edge Function is substantive and correct | VERIFIED | `supabase/functions/telegram-notify/index.ts` — full implementation: profile lookup, Telegram API call, returns `{ok: result.ok}` |
| 7 | telegram-bot handles /start TOKEN linking flow | VERIFIED | `supabase/functions/telegram-bot/index.ts` — full /start TOKEN handler, profile update, error handling |
| 8 | sendNotification wired to telegram-notify Edge Function | VERIFIED | `app.jsx:144` — `supabase.functions.invoke('telegram-notify', { body: { user_id: toUserId, message: bodyText } })` |

**Score:** 7/8 truths verified (NOTIF-04 has a code gap; Telegram delivery for all 4 needs human)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/functions/telegram-notify/index.ts` | Notification delivery to Telegram | VERIFIED | 76 lines; reads TELEGRAM_BOT_TOKEN, looks up telegram_id from profiles, calls Telegram sendMessage API |
| `supabase/functions/telegram-bot/index.ts` | Webhook handler for /start TOKEN linking flow | VERIFIED | 127 lines; handles /start with and without token, updates profiles.telegram_id on successful link |
| `supabase/functions/verify-linking-code/index.ts` | Verify linking code (web flow) | EXISTS | File present — not checked in detail (not on critical path for NOTIF-01..04) |
| `app.jsx` | All 4 notification call sites wired | PARTIAL | NOTIF-01 (line 606), NOTIF-02 (line 736), NOTIF-03 (line 768) wired correctly. NOTIF-04 (line 1018) notifies partner only, not payer. |
| `components/MyRequestsView.jsx` | Accept bid button in active requests tab | VERIFIED | `onAcceptBid` in props destructuring (line 5), conditional buttons at lines 290-305 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app.jsx sendNotification` | `supabase/functions/telegram-notify` | `supabase.functions.invoke('telegram-notify', ...)` | WIRED | `app.jsx:144` — correct function name, correct body shape `{user_id, message}` |
| `app.jsx handleSendMessage` | `sendNotification(partnerId, ...)` | After successful messages insert | WIRED | `app.jsx:732-741` — partnerId formula correct, self-guard present |
| `components/MyRequestsView.jsx bid card` | `app.jsx handleAcceptBid` | `onAcceptBid` prop callback | WIRED | `app.jsx:1576` passes `onAcceptBid={(bidId) => handleAcceptBid(bidId)}`; component uses at line 292 |
| `app.jsx handleAcceptBid` | `supabase bids table` | `supabase.from('bids').update({ status: 'accepted' })` | WIRED | `app.jsx:754-759` — update with `.select().single()` |
| `app.jsx handleCommissionPayment (willReveal)` | `sendNotification to BOTH parties` | `sendNotification(sbUser.id, ...)` and `sendNotification(partnerId, ...)` | NOT WIRED | Only `sendNotification(partnerId, ...)` called at line 1018. No call for payer. |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| NOTIF-01 | 02-01, 02-02, 02-03 | Shipper gets Telegram when owner bids | SATISFIED (code) / HUMAN for delivery | `app.jsx:606` calls `sendNotification` with correct recipient and message |
| NOTIF-02 | 02-02, 02-03 | User gets Telegram on new chat message | SATISFIED | `app.jsx:736` — partnerId formula, guard, correct call |
| NOTIF-03 | 02-02, 02-03 | Owner gets Telegram when bid accepted | SATISFIED | `app.jsx:768` inside `handleAcceptBid` |
| NOTIF-04 | 02-01, 02-03 | Both parties get Telegram when contacts revealed | PARTIAL — payer not notified | `app.jsx:1018` notifies only `partnerId`; no call for `sbUser.id` |

**Orphaned requirements check:** REQUIREMENTS.md marks NOTIF-01..04 as checked (`[x]`). All 4 appear in plan frontmatter. No orphaned IDs.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | No stubs, placeholders, or empty handlers detected in modified files |

---

### Human Verification Required

#### 1. End-to-end Telegram delivery for NOTIF-01

**Test:** As owner, submit a bid on an open shipper request (both accounts must have Telegram linked)
**Expected:** Shipper receives Telegram message "Компания X откликнулась на вашу заявку..." in their bot chat
**Why human:** External Telegram delivery cannot be verified programmatically

#### 2. End-to-end Telegram delivery for NOTIF-02

**Test:** In an active chat, send a message from one side
**Expected:** The OTHER party (not sender) receives "У вас новое сообщение на платформе RailMatch." — sender receives nothing
**Why human:** External Telegram delivery, two accounts required

#### 3. End-to-end Telegram delivery for NOTIF-03

**Test:** As shipper, open "Мои заявки" active tab, click "Принять ставку" on a pending bid
**Expected:** Owner receives "Компания X приняла вашу ставку." in Telegram; app navigates shipper to chat view; button changes to "Открыть чат"
**Why human:** External Telegram delivery required

#### 4. NOTIF-04 — After code fix, verify both parties receive notification

**Test:** Complete commission payment with one party paying full (contacts_revealed). Both shipper and owner should each receive a Telegram message.
**Expected:** Both accounts receive Telegram message confirming contacts are open
**Why human:** Gap must be fixed first (payer notification missing); then requires two live Telegram accounts

---

### Gaps Summary

One code gap found against the NOTIF-04 requirement.

**NOTIF-04 — Payer not notified when contacts are revealed:**

`handleCommissionPayment` in `app.jsx` (around line 1013-1022) correctly sends `sendNotification` to `partnerId` when `willReveal=true`. However, the current user (`sbUser.id`) — who triggered the contact reveal by paying — does not receive a Telegram notification. REQUIREMENTS.md states NOTIF-04 as "обе стороны получают уведомление при раскрытии контактов."

The fix is a one-line addition inside the `willReveal` block:

```javascript
// After the existing sendNotification(partnerId, ...) call:
sendNotification(
    sbUser.id,
    'Контакты открыты — сделка завершена! RailMatch',
    `Контакты партнёра теперь открыты.\n\nОткройте платформу, чтобы увидеть контакты и подписать документы.`
);
```

Note: The 02-03 SUMMARY claimed NOTIF-04 was confirmed via human smoke test, but this was auto-approved via `--auto` flag (per the SUMMARY's own key-decisions field: "Auto-approved via --auto flag"). The delivery was not actually human-verified for NOTIF-04 in a real end-to-end test.

---

_Verified: 2026-03-28T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
