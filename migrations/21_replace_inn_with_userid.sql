-- =============================================
-- БЛОК 1: Выполни ТОЛЬКО этот блок первым
-- =============================================
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
CREATE POLICY "Users can update own requests" ON public.requests FOR UPDATE USING (
    "shipperInn" = auth.uid()::text
);


-- =============================================
-- БЛОК 2: Затем этот
-- =============================================
-- DROP POLICY IF EXISTS "Owners and Shippers can update bids" ON public.bids;
-- CREATE POLICY "Owners and Shippers can update bids" ON public.bids FOR UPDATE USING (
--     "ownerId" = auth.uid()
--     OR "requestId" IN (
--         SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text
--     )
-- );


-- =============================================
-- БЛОК 3: Затем этот
-- =============================================
-- DROP POLICY IF EXISTS "Deal participants can insert documents" ON public.deal_documents;
-- CREATE POLICY "Deal participants can insert documents" ON public.deal_documents FOR INSERT WITH CHECK (
--     bid_id IN (
--         SELECT b.id FROM public.bids b
--         WHERE b."ownerId" = auth.uid()
--            OR b."requestId" IN (SELECT r.id FROM public.requests r WHERE r."shipperInn" = auth.uid()::text)
--     )
-- );


-- =============================================
-- БЛОК 4: И наконец этот
-- =============================================
-- DROP POLICY IF EXISTS "Deal participants can update documents" ON public.deal_documents;
-- CREATE POLICY "Deal participants can update documents" ON public.deal_documents FOR UPDATE USING (
--     bid_id IN (
--         SELECT b.id FROM public.bids b
--         WHERE b."ownerId" = auth.uid()
--            OR b."requestId" IN (SELECT r.id FROM public.requests r WHERE r."shipperInn" = auth.uid()::text)
--     )
-- );
