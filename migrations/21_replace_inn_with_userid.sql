-- Migration: Replace INN-based matching with direct user ID matching in RLS policies
-- shipperInn field (TEXT) now stores auth.uid()::text (user ID) instead of profiles.inn

-- Fix 1: Requests update policy
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
CREATE POLICY "Users can update own requests" ON public.requests FOR UPDATE USING (
    "shipperInn" = auth.uid()::text
);

-- Fix 2: Bids update policy
DROP POLICY IF EXISTS "Owners and Shippers can update bids" ON public.bids;
CREATE POLICY "Owners and Shippers can update bids" ON public.bids FOR UPDATE USING (
    "ownerId" = auth.uid()
    OR "requestId"::text IN (
        SELECT id::text FROM public.requests WHERE "shipperInn" = auth.uid()::text
    )
);

-- Fix 3: Deal documents insert policy
DROP POLICY IF EXISTS "Deal participants can insert documents" ON public.deal_documents;
CREATE POLICY "Deal participants can insert documents" ON public.deal_documents FOR INSERT WITH CHECK (
    bid_id::text IN (
        SELECT b.id::text FROM public.bids b
        WHERE b."ownerId" = auth.uid()
        OR b."requestId"::text IN (SELECT r.id::text FROM public.requests r WHERE r."shipperInn" = auth.uid()::text)
    )
);

-- Fix 4: Deal documents update policy
DROP POLICY IF EXISTS "Deal participants can update documents" ON public.deal_documents;
CREATE POLICY "Deal participants can update documents" ON public.deal_documents FOR UPDATE USING (
    bid_id::text IN (
        SELECT b.id::text FROM public.bids b
        WHERE b."ownerId" = auth.uid()
        OR b."requestId"::text IN (SELECT r.id::text FROM public.requests r WHERE r."shipperInn" = auth.uid()::text)
    )
);
