-- Migration: Replace INN-based matching with direct user ID matching in RLS policies
-- shipperInn field now stores auth.uid() (user ID) instead of profiles.inn

-- Fix 1: Requests update policy
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
CREATE POLICY "Users can update own requests" ON public.requests FOR UPDATE USING (
    "shipperInn" = auth.uid()::text
);

-- Fix 2: Bids update policy
DROP POLICY IF EXISTS "Owners and Shippers can update bids" ON public.bids;
CREATE POLICY "Owners and Shippers can update bids" ON public.bids FOR UPDATE USING (
    auth.uid() = "ownerId"
    OR "requestId" IN (
        SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text
    )
);

-- Fix 3: Deal documents insert policy
DROP POLICY IF EXISTS "Deal participants can insert documents" ON public.deal_documents;
CREATE POLICY "Deal participants can insert documents" ON public.deal_documents FOR INSERT WITH CHECK (
    bid_id IN (
        SELECT id FROM public.bids WHERE "ownerId" = auth.uid()
        OR "requestId" IN (SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text)
    )
);

-- Fix 4: Deal documents update policy
DROP POLICY IF EXISTS "Deal participants can update documents" ON public.deal_documents;
CREATE POLICY "Deal participants can update documents" ON public.deal_documents FOR UPDATE USING (
    bid_id IN (
        SELECT id FROM public.bids WHERE "ownerId" = auth.uid()
        OR "requestId" IN (SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text)
    )
);
