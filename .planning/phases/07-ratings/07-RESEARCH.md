# Phase 7: Рейтинг пользователей - Research

**Researched:** 2026-03-29
**Domain:** PostgreSQL schema design (reviews table), React modal patterns, Supabase RLS, denormalized profile aggregates
**Confidence:** HIGH

## Summary

Phase 7 adds a post-deal rating system: after `contacts_revealed`, each party can confirm deal completion and leave a 1-5 star review with predefined tags and optional text. Reviews are anonymous, one per bid per user, no deadline. Ratings are displayed in the chat header, RequestCard, and profile.

All implementation is client-side + Supabase direct (no Edge Functions needed). The existing modal pattern in ChatWindow (CommissionModal, TinkoffModal) is reused as-is for both the rating modal and the reviews viewer modal. The existing `profiles` state array already loaded in app.jsx provides all profile data needed; a new `reviews` table + two denormalized columns on `profiles` cover the data layer.

The key complexity is: (a) the DB migration needs to be idempotent following the established DROP POLICY IF EXISTS pattern, (b) denormalized aggregates on `profiles` must be kept in sync via a Postgres trigger or manual update after INSERT into `reviews`, and (c) the "Подтвердить завершение сделки" button must be stateful — once submitted it must not allow re-submission (use `completed_by_shipper` / `completed_by_owner` boolean columns on `bids`).

**Primary recommendation:** Add migration 26 for the `reviews` table + bids completion columns + profiles aggregate columns + trigger. Then add UI as local state in ChatWindow and RequestCard with supabase direct calls. Keep reviews query separate from the main data load (load on demand when user opens the Reviews modal).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Кнопка **«Подтвердить завершение сделки»** появляется в чате после статуса `contacts_revealed`
- После нажатия открывается модал **«Оцените партнёра»**
- Каждая сторона подтверждает и оценивает независимо — не нужно ждать партнёра
- Одна оценка на сделку (bid) от каждого участника — повторно оценить нельзя
- Дедлайна нет — можно оценить в любое время после раскрытия контактов
- Звёзды 1–5 (обязательно), предустановленные теги (один или несколько), свободный текст (опционально)
- Теги: Положительные (4-5 звёзд) — «Надёжный», «Оперативный», «Честный», «Рекомендую»; Отрицательные (1-2 звезды) — «Медлительный», «Не отвечал», «Проблемы с оплатой», «Не рекомендую»; 3 звезды — все теги
- Кнопка **«Отзывы»** в шапке чата рядом с именем партнёра (иконка + средняя оценка)
- Модал просмотра: средняя оценка + количество отзывов, счётчики позитивных (≥4) / негативных (≤2), список анонимных отзывов
- В RequestCard и профиле — средняя оценка со звёздочкой (если ≥1 отзыва)
- Отзывы анонимны — автор не показывается; пользователь видит свой отзыв как «Ваш отзыв»

### Claude's Discretion

- Дизайн модала оценки и модала просмотра отзывов
- Цветовая кодировка звёзд (золотые/серые)
- Порядок сортировки отзывов (по дате, новые сверху)
- Как отображать частичный рейтинг (например 4.3 ★)

### Deferred Ideas (OUT OF SCOPE)

- Возможность пожаловаться на отзыв — отдельная фича
- Ответ на отзыв от оцениваемого — отдельная фича
- Фильтрация биржи по рейтингу — Phase 8+
</user_constraints>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase JS client | already installed | DB queries, RLS, realtime | already used everywhere |
| React useState/useEffect | 18 (project std) | local modal state, review fetch | established pattern |
| Tailwind CSS | project std | styling modals | all UI uses Tailwind |
| lucide-react | already installed | Star icon for ratings | already used in ChatWindow/RequestCard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react `Star` | project std | star rating display | rating input + display |

No new npm packages needed. Everything is in the existing stack.

**Installation:**
```bash
# No new packages required
```

---

## Architecture Patterns

### Database Schema

#### New table: `reviews`
```sql
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    tags TEXT[] DEFAULT '{}',
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (from_user_id, bid_id)  -- one review per user per deal
);
```

#### New columns on `bids` (migration 26)
```sql
ALTER TABLE public.bids
    ADD COLUMN IF NOT EXISTS completed_by_shipper BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS completed_by_owner BOOLEAN DEFAULT FALSE;
-- Note: full status='completed' set when both are TRUE (trigger or app logic)
```

#### New columns on `profiles` (denormalized aggregates)
```sql
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
```

#### RLS for `reviews`
Follows the established `DROP POLICY IF EXISTS ... CREATE POLICY` pattern from migration 22:
```sql
-- SELECT: authenticated users can read all reviews (to show partner's reviews)
CREATE POLICY "Authenticated users can view reviews" ON public.reviews
    FOR SELECT USING (auth.role() = 'authenticated');

-- INSERT: only from_user_id = auth.uid()
CREATE POLICY "Users can insert own reviews" ON public.reviews
    FOR INSERT WITH CHECK (from_user_id = auth.uid());

-- No UPDATE, no DELETE policies (reviews are immutable)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
```

#### Postgres trigger to update `profiles` aggregates
```sql
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET
        average_rating = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM public.reviews
            WHERE to_user_id = NEW.to_user_id
        ),
        review_count = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE to_user_id = NEW.to_user_id
        )
    WHERE id = NEW.to_user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_inserted ON public.reviews;
CREATE TRIGGER on_review_inserted
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_profile_rating();
```

**Why trigger over app-side update:** Avoids race conditions if both sides submit at the same time. Keeps aggregate consistent even if client goes offline after INSERT. Established security pattern (SECURITY DEFINER already used in project for `auto_create_profile_trigger`).

### Component Architecture

#### ChatWindow.jsx additions
- Local state: `showRatingModal`, `showReviewsModal`, `myReview` (null | review object), `partnerReviews` (array)
- `hasCompleted` derived from `chat.completed_by_shipper` / `chat.completed_by_owner` per role
- Button "Подтвердить завершение сделки" — shown when `contactsRevealed && !hasCompleted`
- On click: update `bids` completion column + open rating modal
- Rating modal: star selection → tag selection (filtered by stars) → optional text → submit INSERT to `reviews`
- Reviews button in header: shown when `contactsRevealed`, loads reviews on open
- Reviews modal: fetches `SELECT * FROM reviews WHERE to_user_id = partnerId ORDER BY created_at DESC`

#### RequestCard.jsx addition
- Accept `creatorRating` and `creatorReviewCount` as props
- Render `★ 4.3` after the creator name when `creatorReviewCount > 0`

#### app.jsx addition
- `profiles` array already fetched; add `average_rating` and `review_count` to the profiles SELECT query
- Pass `creatorRating` / `creatorReviewCount` to RequestCard (look up from profiles array by creator id)
- No new Realtime subscription needed for reviews (reviews modal loads fresh on open)

### Recommended Project Structure
No new files strictly required. Two new components would help readability but are optional per project conventions (avoid over-engineering). Recommend keeping modal JSX inline in ChatWindow following the existing CommissionModal pattern.

```
components/
├── ChatWindow.jsx     # add RatingModal + ReviewsModal JSX + handlers (inline, like CommissionModal)
├── RequestCard.jsx    # add average_rating display
app.jsx                # update profiles SELECT, pass rating props to RequestCard
migrations/
└── 26_ratings.sql     # reviews table + bids completion columns + profiles columns + trigger + RLS
```

### Anti-Patterns to Avoid

- **Separate ReviewsModal component file:** Overkill for inline modal pattern. CommissionModal (450 lines) is already inline in ChatWindow — same approach.
- **Loading reviews at app startup:** Reviews are not needed on initial load. Fetch only when user opens the Reviews modal (on demand).
- **Storing reviewer identity in display layer:** Reviews are anonymous. Never pass `from_user_id` to the modal display. The "Ваш отзыв" label comes from comparing `from_user_id === currentUserId` at fetch time in the client, not from exposing it in UI props.
- **Manual aggregate computation in app.jsx:** Denormalized columns on `profiles` (updated by trigger) are the correct approach. Do not compute average in JS from a full reviews array.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Average rating computation | JS reduce over reviews array | Postgres trigger updating `profiles.average_rating` | Consistent across clients, no race condition |
| Unique constraint enforcement | JS check before INSERT | `UNIQUE (from_user_id, bid_id)` DB constraint | Atomic, no TOCTOU bug |
| RLS authorization | Custom auth check in handler | Supabase RLS `from_user_id = auth.uid()` | Already the project pattern |
| Star UI component | Custom SVG stars from scratch | lucide-react `Star` + Tailwind `fill-current` | Already in project |

---

## Common Pitfalls

### Pitfall 1: Duplicate review on double-click / double-submit
**What goes wrong:** User clicks "Отправить оценку" twice quickly, inserts two reviews.
**Why it happens:** No loading state guard on the submit button.
**How to avoid:** Disable submit button while `isSubmitting` state is true; also rely on `UNIQUE (from_user_id, bid_id)` constraint as final guard.
**Warning signs:** Supabase INSERT returns `23505 unique_violation` error.

### Pitfall 2: `profiles` SELECT missing `average_rating` / `review_count`
**What goes wrong:** RequestCard always shows no rating even after reviews are created.
**Why it happens:** The profiles fetch in app.jsx line 348 uses an explicit column list: `id, name, company, inn, role, verification_status, is_verified, telegram_id, telegram_username, phone`. New columns must be added to this list.
**How to avoid:** Update the SELECT list in both the main fetch (line 348) and the demo fetch (line 428).

### Pitfall 3: `completed_by_shipper` / `completed_by_owner` not covered by RLS UPDATE policy
**What goes wrong:** Clicking "Подтвердить завершение" fails silently — RLS blocks the update.
**Why it happens:** Migration 22's `bids` UPDATE policy covers bid participants. The update to `completed_by_*` fields is done by each participant on their own bid, so the existing policy covers it. But must verify: the shipper updates via `requestId IN (SELECT id FROM requests WHERE shipperInn = auth.uid()::text)`.
**How to avoid:** Test both roles updating their completion flag before writing rating logic.

### Pitfall 4: Partner's `to_user_id` differs from how `ownerId`/`shipperInn` is stored
**What goes wrong:** Review is saved with wrong `to_user_id` — shipper is stored as `shipperInn` (UUID as text) but `to_user_id` is UUID.
**Why it happens:** The codebase has a historical `shipperInn` column (text) that was migrated in migration 21 to use `auth.uid()` as UUID string. The bid's `ownerId` is a UUID. The `from('profiles')` table uses `id UUID`.
**How to avoid:** When inserting the review, `to_user_id` must be a UUID. For owner reviewing shipper: look up the shipper's profile UUID via the `shipperInn` value (which equals `auth.uid()::text` for the shipper) — it's `profiles.find(p => p.inn === chat.shipperInn)?.id` OR use `chat.shipperId` if that column is populated. For shipper reviewing owner: `chat.ownerId` is already a UUID. Verify `shipperId` is set on bids in the data.

### Pitfall 5: Reviews modal shows reviewer identity
**What goes wrong:** `from_user_id` is included in the SELECT and accidentally rendered.
**Why it happens:** Fetching `SELECT *` exposes all columns.
**How to avoid:** SELECT only `id, to_user_id, rating, tags, comment, created_at, from_user_id` — keep `from_user_id` only for the "Ваш отзыв" check, never render it as a name.

### Pitfall 6: Trigger function requires SECURITY DEFINER to update another user's profile row
**What goes wrong:** Trigger fails to update `profiles` for `to_user_id` because the inserting user only has UPDATE rights on their own profile (RLS policy: `id = auth.uid()`).
**Why it happens:** Triggers running as the invoking user inherit RLS. `SECURITY DEFINER` bypasses RLS.
**How to avoid:** Use `CREATE OR REPLACE FUNCTION ... SECURITY DEFINER` for the trigger function. This is the same pattern used in `14_auto_create_profile_trigger.sql`.

---

## Code Examples

### INSERT review (client-side handler)
```typescript
// In ChatWindow.jsx handleSubmitReview
const { error } = await supabase.from('reviews').insert([{
    from_user_id: currentUserId,         // auth.uid()
    to_user_id: partnerId,               // UUID of reviewed user
    bid_id: chat.id,
    rating: selectedStars,
    tags: selectedTags,
    comment: commentText.trim() || null,
}]);
if (error?.code === '23505') {
    // Already reviewed — show message, don't throw
}
```

### Fetch partner's reviews (load on modal open)
```typescript
// In ChatWindow.jsx handleOpenReviewsModal
const { data } = await supabase
    .from('reviews')
    .select('id, rating, tags, comment, created_at, from_user_id')
    .eq('to_user_id', partnerId)
    .order('created_at', { ascending: false });
setPartnerReviews(data || []);
```

### Mark deal completed + open rating modal
```typescript
// In ChatWindow.jsx handleConfirmDealCompletion
const completionField = isShipper ? 'completed_by_shipper' : 'completed_by_owner';
const { error } = await supabase.from('bids')
    .update({ [completionField]: true })
    .eq('id', chat.id);
if (!error) {
    setActiveChat(prev => ({ ...prev, [completionField]: true }));
    setShowRatingModal(true);
}
```

### Star rating display (RequestCard)
```jsx
// Source: project conventions — Tailwind + lucide-react Star
{creatorReviewCount > 0 && (
    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
        <Star className="w-3 h-3 fill-current" />
        {creatorRating.toFixed(1)}
    </span>
)}
```

### Tag filtering by star count
```typescript
const POSITIVE_TAGS = ['Надёжный', 'Оперативный', 'Честный', 'Рекомендую'];
const NEGATIVE_TAGS = ['Медлительный', 'Не отвечал', 'Проблемы с оплатой', 'Не рекомендую'];

const getTagsForRating = (stars) => {
    if (stars >= 4) return POSITIVE_TAGS;
    if (stars <= 2) return NEGATIVE_TAGS;
    return [...POSITIVE_TAGS, ...NEGATIVE_TAGS]; // 3 stars: all
};
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Compute rating average in JS on every render | Denormalized `average_rating` on `profiles`, updated by Postgres trigger | O(1) read, consistent across clients |
| Load all reviews at app startup | Fetch reviews on demand when modal opens | Reduces initial load |

---

## Open Questions

1. **`shipperId` UUID on bids — is it populated?**
   - What we know: `bids` table has `ownerId UUID` (populated). `shipperInn TEXT` is the shipper identifier. Migration 21 changed `shipperInn` to store `auth.uid()::text`.
   - What's unclear: Whether `bids.shipperId` (UUID FK to profiles) exists and is populated, or whether only `shipperInn` (text) is available for the shipper.
   - Recommendation: Check `bids` columns in Supabase Dashboard before writing review INSERT logic. If `shipperId` doesn't exist, derive `to_user_id` for shipper reviews by looking up `profiles.find(p => p.id === sbUser.id && p.inn === chat.shipperInn)` — but since `shipperInn` stores the UUID string after migration 21, `to_user_id` for the owner reviewing shipper is just `chat.shipperInn` cast to UUID.

2. **Bids `status` constraint — does `completed` need to be added?**
   - What we know: Current constraint in migration 12 does not include `'completed'`. Context.md says both confirming triggers `status = 'completed'`.
   - What's unclear: Is `status='completed'` actually needed, or is `completed_by_shipper AND completed_by_owner` sufficient as the completion signal?
   - Recommendation: Add `'completed'` to the bids status constraint in migration 26 if the planner decides to set it. Alternatively, use only the boolean columns and avoid the status change to minimize risk.

---

## Validation Architecture

> `workflow.nyquist_validation` is absent from `.planning/config.json` — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — project has no test setup |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

This is a frontend-only project (React + Vite) with no test runner configured. All validation is manual smoke testing.

### Phase Requirements → Test Map
| ID | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| RAT-01 | "Подтвердить завершение сделки" appears after contacts_revealed | manual-only | — | N/A |
| RAT-02 | Rating modal opens on confirm, shows stars + tags + text | manual-only | — | N/A |
| RAT-03 | Tags filter correctly by star count (1-2=negative, 4-5=positive, 3=all) | manual-only | — | N/A |
| RAT-04 | Review INSERT succeeds; second attempt blocked by UNIQUE constraint | manual-only | — | N/A |
| RAT-05 | Profiles `average_rating` + `review_count` updated after review | manual-only | — | N/A |
| RAT-06 | "Отзывы" button appears in chat header; modal loads correctly | manual-only | — | N/A |
| RAT-07 | RequestCard shows average_rating when review_count >= 1 | manual-only | — | N/A |
| RAT-08 | Reviewer identity not shown in reviews list | manual-only | — | N/A |

### Sampling Rate
- **Per task:** Human smoke test of the specific task's feature in live app
- **Phase gate:** Full end-to-end deal flow test (contacts_revealed → confirm → rate → view reviews → RequestCard shows rating) before `/gsd:verify-work`

### Wave 0 Gaps
None — no test infrastructure exists or is expected in this project.

---

## Sources

### Primary (HIGH confidence)
- Direct code reading: `app.jsx`, `components/ChatWindow.jsx`, `components/RequestCard.jsx` — verified patterns and data flow
- Direct schema reading: `migrations/01_initial_schema.sql`, `migrations/12_commission_contacts_pipeline.sql`, `migrations/22_enable_rls_final_policies.sql`, `migrations/25_commission_payment_flow.sql`
- `.planning/phases/07-ratings/07-CONTEXT.md` — locked user decisions

### Secondary (MEDIUM confidence)
- Supabase RLS `SECURITY DEFINER` trigger pattern — verified against `migrations/14_auto_create_profile_trigger.sql` in this project
- Postgres `UNIQUE` constraint as double-submit guard — standard PostgreSQL behavior

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all verified in existing code
- Architecture: HIGH — all patterns directly observed in codebase
- DB schema: HIGH — matches CONTEXT.md spec + existing migration patterns
- Pitfalls: HIGH (code-reading-based) — except `shipperId` question (MEDIUM — needs live DB check)

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable codebase, no external dependencies)
