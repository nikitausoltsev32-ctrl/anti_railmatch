-- Migration: Replace INN-based matching with direct user ID matching in RLS policies
-- shipperInn (TEXT) now stores auth.uid()::text instead of profiles.inn
--
-- Column types reference:
--   bids."ownerId"    = UUID
--   bids."requestId"  = UUID
--   bids.id           = UUID
--   requests.id       = UUID
--   requests."shipperInn" = TEXT
--   deal_documents.bid_id = UUID
--   auth.uid()        = UUID

-- Fix 1: Requests update policy
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
CREATE POLICY "Users can update own requests" ON public.requests FOR UPDATE USING (
    "shipperInn" = auth.uid()::text
);

-- Fix 2: Bids update policy  (uuid = uuid and uuid IN uuid are fine)
DROP POLICY IF EXISTS "Owners and Shippers can update bids" ON public.bids;
CREATE POLICY "Owners and Shippers can update bids" ON public.bids FOR UPDATE USING (
    "ownerId" = auth.uid()
    OR "requestId" IN (
        SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text
    )
);

-- Fix 3: Deal documents insert policy  (bid_id uuid IN uuid)
DROP POLICY IF EXISTS "Deal participants can insert documents" ON public.deal_documents;
CREATE POLICY "Deal participants can insert documents" ON public.deal_documents FOR INSERT WITH CHECK (
    bid_id IN (
        SELECT b.id FROM public.bids b
        WHERE b."ownerId" = auth.uid()
           OR b."requestId" IN (SELECT r.id FROM public.requests r WHERE r."shipperInn" = auth.uid()::text)
    )
);

-- Fix 4: Deal documents update policy
DROP POLICY IF EXISTS "Deal participants can update documents" ON public.deal_documents;
CREATE POLICY "Deal participants can update documents" ON public.deal_documents FOR UPDATE USING (
    bid_id IN (
        SELECT b.id FROM public.bids b
        WHERE b."ownerId" = auth.uid()
           OR b."requestId" IN (SELECT r.id FROM public.requests r WHERE r."shipperInn" = auth.uid()::text)
    )
);
