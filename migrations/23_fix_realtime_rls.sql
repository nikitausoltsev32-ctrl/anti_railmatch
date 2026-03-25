-- Migration 23: Fix Realtime + RLS for bids and messages
-- REPLICA IDENTITY FULL lets Supabase evaluate RLS policies on realtime events.
-- Without it, only the PK is in the replication stream — insufficient for
-- policies referencing columns like "ownerId", "requestId", "shipperInn".
-- Idempotent — safe to run multiple times.

ALTER TABLE public.bids REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add to publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bids'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
