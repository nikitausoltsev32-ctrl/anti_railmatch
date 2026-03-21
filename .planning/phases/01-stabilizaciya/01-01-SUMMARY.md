---
phase: 01-stabilizaciya
plan: 01
subsystem: database
tags: [postgres, supabase, rls, row-level-security, realtime]

# Dependency graph
requires: []
provides:
  - migrations/22_enable_rls_final_policies.sql — canonical RLS for requests, bids, profiles, messages
  - Realtime publication extended to include profiles table
affects: [02-stabilizaciya, 03-stabilizaciya, any plan requiring RLS-secured queries]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "auth.uid()::text for INN-based ownership checks"
    - "DROP POLICY IF EXISTS before CREATE POLICY to prevent migration conflicts"
    - "Subquery-based SELECT policy: requestId IN (SELECT id FROM requests WHERE shipperInn = auth.uid()::text)"

key-files:
  created:
    - migrations/22_enable_rls_final_policies.sql
  modified: []

key-decisions:
  - "Single authoritative migration 22 drops all prior conflicting policies before recreating canonical set"
  - "auth.uid()::text pattern (not inn column) used for all ownership comparisons — matches migration 21 canonical"
  - "Bids and messages SELECT policies use subquery to allow shipper access without storing redundant shipperInn in those tables"

patterns-established:
  - "Pattern 1: DROP IF EXISTS + CREATE for idempotent policy migrations"
  - "Pattern 2: shipperInn = auth.uid()::text for shipper ownership, ownerId = auth.uid() for carrier ownership"

requirements-completed: [STAB-02, STAB-03, STAB-05]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 1 Plan 01: Canonical RLS Policies Migration Summary

**Single migration file that drops all prior conflicting RLS policies and enables Row Level Security on requests, bids, profiles, messages using auth.uid()::text ownership pattern**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-22T00:00:00Z
- **Completed:** 2026-03-22T00:05:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created migrations/22_enable_rls_final_policies.sql with DROP IF EXISTS for all 21 prior policy names
- Canonical SELECT/INSERT/UPDATE policies for all 4 core tables using auth.uid()::text
- Bids and messages policies use subquery to grant shipper access via requestId → shipperInn chain
- RLS enabled on requests, bids, profiles, messages
- profiles added to supabase_realtime publication

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 22 — canonical RLS policies** - `03fef83` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `migrations/22_enable_rls_final_policies.sql` - Idempotent migration: drops 21 conflicting policies, creates canonical RLS for 4 tables, enables RLS, extends Realtime publication

## Decisions Made
- Used `DROP POLICY IF EXISTS` before every `CREATE POLICY` so the migration can be applied safely regardless of which prior migrations (01, 09, 15, 20) have run
- auth.uid()::text comparison for shipperInn field (UUID stored as text) — consistent with migration 21
- No INSERT policy on profiles — profile creation happens via `on_auth_user_created` trigger, not direct INSERT

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Migration 22 must be applied manually via Supabase Dashboard SQL Editor.** This is by design — Plan 03 handles the application checkpoint. Steps:
1. Open Supabase Dashboard → SQL Editor
2. Paste contents of `migrations/22_enable_rls_final_policies.sql`
3. Run

## Next Phase Readiness
- Migration 22 file is ready to apply
- RLS will be enforced on all 4 core tables once applied
- Realtime will deliver profile updates to subscribers once applied
- Plan 02 (auth fixes) and Plan 03 (apply migrations checkpoint) can proceed

---
*Phase: 01-stabilizaciya*
*Completed: 2026-03-22*
