-- Шаг 1: Удаляем ВСЕ старые политики которые используют INN
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
DROP POLICY IF EXISTS "Shippers can update own requests" ON public.requests;
DROP POLICY IF EXISTS "Owners and Shippers can update bids" ON public.bids;
DROP POLICY IF EXISTS "Deal participants can insert documents" ON public.deal_documents;
DROP POLICY IF EXISTS "Deal participants can update documents" ON public.deal_documents;

-- Шаг 2: Создаём новые политики с user ID вместо INN
-- shipperInn (TEXT) теперь хранит auth.uid()::text

CREATE POLICY "Users can update own requests" ON public.requests FOR UPDATE USING (
    "shipperInn" = auth.uid()::text
);

CREATE POLICY "Owners and Shippers can update bids" ON public.bids FOR UPDATE USING (
    "ownerId" = auth.uid()
    OR "requestId" IN (
        SELECT id FROM public.requests WHERE "shipperInn" = auth.uid()::text
    )
);

CREATE POLICY "Deal participants can insert documents" ON public.deal_documents FOR INSERT WITH CHECK (
    bid_id IN (
        SELECT b.id FROM public.bids b
        WHERE b."ownerId" = auth.uid()
           OR b."requestId" IN (SELECT r.id FROM public.requests r WHERE r."shipperInn" = auth.uid()::text)
    )
);

CREATE POLICY "Deal participants can update documents" ON public.deal_documents FOR UPDATE USING (
    bid_id IN (
        SELECT b.id FROM public.bids b
        WHERE b."ownerId" = auth.uid()
           OR b."requestId" IN (SELECT r.id FROM public.requests r WHERE r."shipperInn" = auth.uid()::text)
    )
);
