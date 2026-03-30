---
phase: 07-ratings
plan: 01
subsystem: database
tags: [postgres, supabase, rls, triggers, ratings, reviews]

requires:
  - phase: 01-stabilizaciya
    provides: profiles and bids tables this migration extends
  - phase: 02-telegram-notifications
    provides: stable schema foundation used by Phase 7

provides:
  - reviews table with UNIQUE(from_user_id, bid_id) constraint
  - bids.completed_by_shipper and bids.completed_by_owner boolean columns
  - profiles.average_rating NUMERIC(3,2) and profiles.review_count INTEGER columns
  - SECURITY DEFINER trigger on_review_inserted maintaining denormalized rating averages
  - RLS policies: SELECT for all authenticated, INSERT only for review author

affects: [07-02, 07-03, ratings-ui, deal-completion-flow]

tech-stack:
  added: []
  patterns:
    - "DROP POLICY IF EXISTS before CREATE POLICY for idempotent RLS (migration 22 pattern)"
    - "SECURITY DEFINER trigger for privileged profile updates (migration 14 pattern)"
    - "CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS for idempotent DDL"

key-files:
  created:
    - migrations/26_ratings.sql
  modified: []

key-decisions:
  - "Boolean completion columns (completed_by_shipper, completed_by_owner) used instead of adding 'completed' to bids.status CHECK constraint — avoids breaking existing constraint"
  - "SECURITY DEFINER trigger recalculates average_rating and review_count on every INSERT — simple and correct for low-volume review writes"

patterns-established:
  - "Migration 26 follows established pattern: DROP POLICY IF EXISTS + CREATE for RLS, SECURITY DEFINER for trigger"

requirements-completed: [RATING-01, RATING-02, RATING-03, RATING-04, RATING-05, RATING-06]

duration: 2min
completed: 2026-03-30
---

# Phase 07 Plan 01: Ratings Data Layer Summary

**Postgres schema for ratings: reviews table with 1-5 star check, bids completion booleans, profiles denormalized averages maintained by SECURITY DEFINER trigger, and RLS policies**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-30T13:29:28Z
- **Completed:** 2026-03-30T13:30:44Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `migrations/26_ratings.sql` — idempotent migration applying all Phase 7 schema objects
- reviews table with `UNIQUE(from_user_id, bid_id)` prevents duplicate reviews per deal
- Trigger `on_review_inserted` automatically recalculates `average_rating` and `review_count` on profiles after each review INSERT

## Task Commits

1. **Task 1: Write migration 26** - `6408106` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `migrations/26_ratings.sql` — Full ratings schema: reviews table, bids completion columns, profiles aggregate columns, RLS policies, SECURITY DEFINER trigger

## Decisions Made

- Boolean columns `completed_by_shipper` / `completed_by_owner` on bids used as completion signal instead of adding 'completed' to `bids.status` CHECK constraint — the CHECK constraint from migration 12 cannot be safely extended without risk
- Trigger uses scalar subqueries for both `average_rating` and `review_count` recalculation on every INSERT — simple, correct, and performs well for expected review volume

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

**Manual step required:** Apply migration in Supabase Dashboard — SQL Editor → paste contents of `migrations/26_ratings.sql` → Run.

Verify:
- `reviews` table appears in Table Editor
- `bids` table has `completed_by_shipper` and `completed_by_owner` columns
- `profiles` table has `average_rating` and `review_count` columns
- Trigger `on_review_inserted` appears in Database → Functions

## Next Phase Readiness

- Schema foundation complete — Plans 07-02 and 07-03 can proceed
- No blockers once migration is applied in Supabase Dashboard

---
*Phase: 07-ratings*
*Completed: 2026-03-30*
