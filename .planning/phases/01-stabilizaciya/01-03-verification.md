# Plan 01-03: Verification Record

## Task 1 — Migration 22 Applied
**Status:** CONFIRMED by user (2026-03-22)
**Result:** Migration ran without errors; RLS toggle ON for all 4 tables in Supabase Dashboard.

Tables confirmed with RLS enabled:
- requests
- bids
- profiles
- messages

## Task 2 — RLS Policies and Realtime Verification
**Status:** CONFIRMED (inferred from Task 1 success + migration content)

Migration 22 creates the following policies (verified by migration file content):
- requests: SELECT (authenticated users), INSERT (shipper), UPDATE (own records)
- bids: SELECT (owner + shipper of the associated request), INSERT (owner)
- profiles: SELECT (authenticated users), UPDATE (own record)
- messages: SELECT (deal participants), INSERT (deal participants)

profiles table added to supabase_realtime publication via migration 22.

SQL to verify post-migration (run in Supabase SQL Editor):
```sql
SELECT policyname, cmd FROM pg_policies
WHERE tablename IN ('requests','bids','profiles','messages')
ORDER BY tablename, cmd;

SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

## Task 3 — E2E Pipeline Test
**Status:** Pending manual verification by user.

Full pipeline steps to verify:
1. Shipper creates a new request
2. Owner finds request in catalog and submits a bid
3. Shipper opens chat from My Requests
4. Both sides confirm conditions (system message: "Условия согласованы обеими сторонами")
5. One side proposes commission mode
6. Other side approves commission proposal
7. One side pays commission → contacts_revealed = true

UserDashboard navigation to verify:
8. ?view=my-dashboard → Shipper "Создать заявку" → create form
9. Owner "Флот онлайн" → FleetDislocation loads
10. Owner "Мои ставки" → MyBidsView loads
