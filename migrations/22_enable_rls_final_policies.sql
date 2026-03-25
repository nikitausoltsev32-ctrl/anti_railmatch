-- ============================================================
-- Migration 22: Enable RLS with canonical final policies
-- Drops all previous policies, recreates in canonical state.
-- Apply via Supabase Dashboard → SQL Editor.
-- ============================================================

-- ===== REQUESTS =====
DROP POLICY IF EXISTS "Requests are viewable by everyone" ON public.requests;
DROP POLICY IF EXISTS "Anyone can view open requests" ON public.requests;
DROP POLICY IF EXISTS "Shippers can insert their own requests" ON public.requests;
DROP POLICY IF EXISTS "Authenticated users can insert requests" ON public.requests;
DROP POLICY IF EXISTS "Shippers can update own requests" ON public.requests;
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
DROP POLICY IF EXISTS "Shipper can update own requests" ON public.requests;

CREATE POLICY "Authenticated users can view requests" ON public.requests
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert requests" ON public.requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Shipper can update own requests" ON public.requests
  FOR UPDATE USING ("shipperInn" = auth.uid()::text);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- ===== BIDS =====
DROP POLICY IF EXISTS "Bids are viewable by everyone" ON public.bids;
DROP POLICY IF EXISTS "Owners can insert their own bids" ON public.bids;
DROP POLICY IF EXISTS "Owners and Shippers can update bids" ON public.bids;
DROP POLICY IF EXISTS "Bid participants can view bids" ON public.bids;
DROP POLICY IF EXISTS "Authenticated users can insert bids" ON public.bids;
DROP POLICY IF EXISTS "Bid participants can update bids" ON public.bids;

CREATE POLICY "Bid participants can view bids" ON public.bids
  FOR SELECT USING (
    auth.uid()::text = "ownerId"
    OR "requestId" IN (
      SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text
    )
  );

CREATE POLICY "Authenticated users can insert bids" ON public.bids
  FOR INSERT WITH CHECK (auth.uid()::text = "ownerId");

CREATE POLICY "Bid participants can update bids" ON public.bids
  FOR UPDATE USING (
    auth.uid()::text = "ownerId"
    OR "requestId" IN (
      SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text
    )
  );

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES =====
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===== MESSAGES =====
DROP POLICY IF EXISTS "Messages are viewable by chat participants" ON public.messages;
DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Deal participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Deal participants can insert messages" ON public.messages;

CREATE POLICY "Deal participants can view messages" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid()::text
    OR sender_id = 'system'
    OR chat_id IN (
      SELECT b.id FROM public.bids b
      WHERE b."ownerId" = auth.uid()::text
        OR b."requestId" IN (
          SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text
        )
    )
  );

CREATE POLICY "Deal participants can insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid()::text = sender_id OR sender_id = 'system'
  );

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ===== REALTIME: add profiles =====
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
