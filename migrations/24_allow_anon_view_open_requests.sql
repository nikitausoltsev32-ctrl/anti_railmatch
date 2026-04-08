-- Migration 24: Allow anon users to view open requests
-- Fixes demo mode showing empty exchange.
-- Migration 22 set requests SELECT to require auth.role() = 'authenticated',
-- which blocks the demo user (not logged in via Supabase auth, role = 'anon').
-- This policy lets any visitor read requests with status = 'open'.
-- Closed/cancelled/in-progress requests remain hidden from anon.
CREATE POLICY "Anyone can view open requests" ON public.requests
  FOR SELECT USING (status = 'open');
