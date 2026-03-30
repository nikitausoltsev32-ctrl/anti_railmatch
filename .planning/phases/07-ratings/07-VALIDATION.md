---
phase: 7
slug: ratings
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser testing (no automated test framework in this React project) |
| **Config file** | none |
| **Quick run command** | Open app in browser, navigate to completed deal chat |
| **Full suite command** | Full E2E: create deal → pay commission → reveal contacts → confirm completion → rate → view reviews |
| **Estimated runtime** | ~5 minutes manual |

---

## Sampling Rate

- **After every task commit:** Build check (`npm run build` — no errors)
- **After every plan wave:** Manual smoke test in browser
- **Before `/gsd:verify-work`:** Full E2E flow must complete without errors
- **Max feedback latency:** ~5 minutes

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | DB schema | build | `npm run build` | ✅ | ⬜ pending |
| 7-02-01 | 02 | 2 | Completion button | manual | browser test | ✅ | ⬜ pending |
| 7-02-02 | 02 | 2 | Rating modal | manual | browser test | ✅ | ⬜ pending |
| 7-03-01 | 03 | 2 | Reviews modal | manual | browser test | ✅ | ⬜ pending |
| 7-03-02 | 03 | 2 | Rating on cards | manual | browser test | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (no test framework to install)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Кнопка «Подтвердить завершение» появляется после contacts_revealed | RATING-01 | UI state | Open chat with contacts_revealed=true, verify button shows |
| Модал оценки открывается, звёзды кликабельны | RATING-02 | UI interaction | Click confirm button, select 1-5 stars, verify tags update |
| Теги фильтруются по звёздам (1-2 → негатив, 4-5 → позитив, 3 → все) | RATING-02 | Dynamic UI | Select different star counts, verify tag list changes |
| Отзыв сохраняется в БД (reviews table) | RATING-03 | DB write | Submit review, check Supabase dashboard |
| Кнопку нельзя нажать повторно | RATING-04 | State guard | After review submitted, button should be disabled/hidden |
| Кнопка «Отзывы» показывает рейтинг партнёра | RATING-05 | UI | Open chat, verify star count/avg near partner name |
| Модал отзывов показывает позитивных/негативных | RATING-05 | UI | Click Reviews, verify positive/negative counts |
| Средний рейтинг отображается в RequestCard | RATING-06 | UI | View request listing, check star display |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
