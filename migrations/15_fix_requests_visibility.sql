-- Migration 15: Fix requests visibility
--
-- Problems addressed:
-- 1. The requests status CHECK constraint did not include 'cancelled', causing
--    handleCancelRequest to silently fail (constraint violation) and leave
--    cancelled requests visible on the exchange. The status is now expanded
--    to include 'cancelled' for forward compatibility, and the app code has
--    been updated to use 'closed' (already in the constraint since migration 10).
--
-- 2. The SELECT RLS policy is explicitly re-confirmed to allow all authenticated
--    users to read 'open' requests, preventing any policy drift that could
--    hide newly created requests from the marketplace.
--
-- 3. An index on (status, created_at DESC) is added so the initial data-fetch
--    query (ordered by created_at) is efficient even as the requests table grows.

-- ── 1. Expand requests status constraint to include 'cancelled' ─────────────
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE public.requests ADD CONSTRAINT requests_status_check
    CHECK (status IN ('open', 'completed', 'closed', 'cancelled'));

-- ── 2. Re-confirm SELECT RLS policy allows everyone to read requests ─────────
-- Drop any existing SELECT policies to avoid duplicates, then recreate cleanly.
DROP POLICY IF EXISTS "Requests are viewable by everyone" ON public.requests;
DROP POLICY IF EXISTS "Anyone can view open requests" ON public.requests;

-- All authenticated users (and even anon for demo mode) can read requests.
-- The application-level role filter (shipper sees owner offers, owner sees
-- shipper offers) is enforced in the frontend; the DB just needs to return rows.
CREATE POLICY "Requests are viewable by everyone" ON public.requests
    FOR SELECT USING (true);

-- ── 3. Ensure INSERT policy allows any authenticated user ───────────────────
-- (Already set by migration 09, but re-stated here for clarity / idempotency)
DROP POLICY IF EXISTS "Authenticated users can insert requests" ON public.requests;
CREATE POLICY "Authenticated users can insert requests" ON public.requests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ── 4. Performance index for the default data-fetch query ──────────────────
CREATE INDEX IF NOT EXISTS idx_requests_status_created_at
    ON public.requests (status, created_at DESC);

-- ── 5. Enable Realtime for the requests table (idempotent) ─────────────────
-- This ensures INSERT events are broadcast so the frontend subscription works
-- as a secondary refresh mechanism (primary fix is the optimistic state update).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
    END IF;
END
$$;
