-- Fix 1: Bids update policy
DROP POLICY IF EXISTS "Owners and Shippers can update bids" ON public.bids;
CREATE POLICY "Owners and Shippers can update bids" ON public.bids FOR UPDATE USING (
    auth.uid() = "ownerId"
    OR "requestId" IN (
        SELECT id FROM public.requests
        WHERE "shipperInn" = (SELECT inn FROM public.profiles WHERE id = auth.uid())
    )
);

-- Fix 2: Messages insert policy
DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
CREATE POLICY "Participants can insert messages" ON public.messages FOR INSERT WITH CHECK (
    auth.uid()::text = sender_id OR sender_id = 'system'
);

-- Fix 3: Deal documents policies
DROP POLICY IF EXISTS "Deal participants can insert documents" ON public.deal_documents;
DROP POLICY IF EXISTS "Deal participants can update documents" ON public.deal_documents;
CREATE POLICY "Deal participants can insert documents" ON public.deal_documents FOR INSERT WITH CHECK (
    bid_id IN (
        SELECT id FROM public.bids WHERE "ownerId" = auth.uid()
        OR "requestId" IN (SELECT id FROM public.requests WHERE "shipperInn" = (SELECT inn FROM public.profiles WHERE id = auth.uid()))
    )
);
CREATE POLICY "Deal participants can update documents" ON public.deal_documents FOR UPDATE USING (
    bid_id IN (
        SELECT id FROM public.bids WHERE "ownerId" = auth.uid()
        OR "requestId" IN (SELECT id FROM public.requests WHERE "shipperInn" = (SELECT inn FROM public.profiles WHERE id = auth.uid()))
    )
);

-- Fix 4: Requests update policy
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
CREATE POLICY "Users can update own requests" ON public.requests FOR UPDATE USING (
    "shipperInn" = (SELECT inn FROM public.profiles WHERE id = auth.uid())
);
