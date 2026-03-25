-- Migration 24: Set REPLICA IDENTITY FULL on requests
-- Required so Supabase Realtime can reliably evaluate RLS policies
-- on UPDATE events (status changes, cancellations, etc.)
ALTER TABLE public.requests REPLICA IDENTITY FULL;
