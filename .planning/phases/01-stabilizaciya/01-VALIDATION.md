---
phase: 1
slug: stabilizaciya
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Ручное тестирование в браузере + Supabase SQL editor |
| **Config file** | none |
| **Quick run command** | Открыть production URL, войти как shipper, войти как owner |
| **Full suite command** | Пройти полный pipeline: заявка → ставка → чат → комиссия → контакты |
| **Estimated runtime** | ~15 minutes |

---

## Sampling Rate

- **After every task commit:** Run `Открыть production URL, войти как shipper, войти как owner`
- **After every plan wave:** Run `Пройти полный pipeline: заявка → ставка → чат → комиссия → контакты`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~900 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Verification Steps | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 1-01-01 | 01 | 1 | STAB-02 | manual | Проверить в Supabase Dashboard: таблицы, колонки из migration 12 (contacts_revealed), migration 13 (violation_points), migration 14 (trigger on_auth_user_created) | ⬜ pending |
| 1-02-01 | 02 | 1 | STAB-03 | manual | Открыть два браузера, создать request в первом, убедиться что второй получил событие без refresh | ⬜ pending |
| 1-03-01 | 03 | 1 | STAB-05 | manual | SQL-проверки в editor: `SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claims = '{"sub":"UUID_ДРУГОГО_ПОЛЬЗОВАТЕЛЯ"}'; SELECT * FROM bids;` | ⬜ pending |
| 1-04-01 | 04 | 2 | STAB-04 | manual | Полный сценарий: создать заявку (shipper) → сделать ставку (owner) → открыть чат → согласовать комиссию → оплатить → contacts_revealed = true | ⬜ pending |
| 1-05-01 | 05 | 2 | STAB-06 | manual | Нажать каждую кнопку в UserDashboard, убедиться что view меняется на правильный | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Нет тестовой инфраструктуры — Phase 1 полностью ручная верификация через Supabase Dashboard и браузер

*Existing manual verification covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Миграции применены без конфликтов | STAB-02 | SQL DDL — нет автотестов | Supabase Dashboard: Schema Editor → проверить таблицы и колонки |
| Realtime работает для requests/bids/messages | STAB-03 | Требует два браузера и live соединение | Два браузера: создать request в первом, убедиться что второй обновился без refresh |
| E2E pipeline работает | STAB-04 | Полный flow через несколько ролей | Полный сценарий: заявка → ставка → чат → комиссия → оплата → contacts_revealed |
| RLS корректен | STAB-05 | Требует SQL editor с SET LOCAL | SQL editor: имитировать другого пользователя, проверить что чужие bids не видны |
| Кнопки UserDashboard работают | STAB-06 | UI поведение | Нажать каждую кнопку, убедиться в правильной навигации |

---

## Validation Sign-Off

- [ ] All tasks have manual verify steps documented
- [ ] All requirements (STAB-02..06) covered
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
