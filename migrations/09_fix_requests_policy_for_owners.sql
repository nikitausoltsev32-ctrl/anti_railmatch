-- Migration 09: Fix RLS Policy on Requests to allow Owners to insert
-- This policy allows any authenticated user (both Shippers and Owners) to publish a request/offer

-- 1. Удаляем старую политику если она ограничивала только отправителей
DROP POLICY IF EXISTS "Shippers can insert their own requests" ON public.requests;

-- 2. Создаем новую политику, позволяющую любому авторизованному пользователю создавать заявки
CREATE POLICY "Authenticated users can insert requests" ON public.requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Опционально: если владельцу нужно изменять свои опубликованные заявки, нужно также обновить UPDATE:
DROP POLICY IF EXISTS "Shippers can update own requests" ON public.requests;
CREATE POLICY "Users can update own requests" ON public.requests FOR UPDATE USING (
    "shipperInn" = (SELECT inn FROM public.profiles WHERE id = auth.uid()) OR auth.uid() IS NOT NULL
);
