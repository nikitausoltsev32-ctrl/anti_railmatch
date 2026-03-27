---
phase: 2
slug: telegram-notifications
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual smoke testing (no automated test framework detected) |
| **Config file** | none |
| **Quick run command** | Manual: verify code changes in browser + Supabase function logs |
| **Full suite command** | Manual: run full pipeline (bid → accept → chat message → contacts reveal) with real Telegram-linked account |
| **Estimated runtime** | ~10 minutes (manual) |

---

## Sampling Rate

- **After every task commit:** Code review — verify `sendNotification` call present at correct location, no self-notification bug
- **After every plan wave:** Smoke test with real Telegram-linked account
- **Before `/gsd:verify-work`:** All 4 notification events (NOTIF-01..04) confirmed delivered to Telegram
- **Max feedback latency:** Manual verification per wave

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| Deploy telegram-notify | 01 | 1 | NOTIF-01..04 | smoke/manual | `supabase functions invoke telegram-notify --body '{"user_id":"<uuid>","message":"test"}'` | ❌ Wave 0 | ⬜ pending |
| Deploy telegram-bot + webhook | 01 | 1 | NOTIF-03 | smoke/manual | `/start TOKEN` in bot → confirm linked | ❌ Wave 0 | ⬜ pending |
| Add sendNotification to handleSendMessage | 02 | 1 | NOTIF-02 | smoke/manual | Send message in chat → check Telegram | ❌ Wave 0 | ⬜ pending |
| Add handleAcceptBid + UI | 02 | 1 | NOTIF-03 | smoke/manual | Accept bid as shipper → check owner Telegram | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No automated tests applicable — all validation is manual smoke testing with a real Telegram-linked account
- Deployment of `telegram-notify`, `telegram-bot`, `verify-linking-code` must happen before any code changes are testable
- Telegram webhook registration (`setWebhook`) must happen once after `telegram-bot` is deployed
- At least one user account must have `telegram_id` set in profiles for smoke testing

*Note: NOTIF-01 and NOTIF-04 are already in code — only deployment verification needed. NOTIF-02 and NOTIF-03 require code changes.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shipper gets TG on new bid | NOTIF-01 | Telegram delivery is external, fire-and-forget, no return value checked in app | 1. Link Telegram to shipper account 2. As owner, submit bid on shipper's request 3. Verify TG message received by shipper |
| Participant gets TG on new chat message | NOTIF-02 | Same — external Telegram delivery | 1. Link Telegram to both accounts 2. Send message in chat 3. Verify other party receives TG notification |
| Owner gets TG when bid accepted | NOTIF-03 | Same — external Telegram delivery | 1. Link Telegram to owner account 2. As shipper, click "Принять ставку" on owner's pending bid 3. Verify owner receives TG notification 4. Verify button changed to "Открыть чат" |
| Both get TG on contacts reveal | NOTIF-04 | Same — external Telegram delivery | 1. Link Telegram to both accounts 2. Complete commission payment 3. Verify both parties receive TG notification |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency acceptable (manual smoke per wave)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
