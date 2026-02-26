-- Migration 05: Fleet Management (Wagons)
CREATE TABLE IF NOT EXISTS public.wagons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT CHECK (status IN ('available', 'in_transit', 'maintenance')) DEFAULT 'available',
    last_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.wagons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wagons are viewable by owner" ON public.wagons FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert their own wagons" ON public.wagons FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own wagons" ON public.wagons FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own wagons" ON public.wagons FOR DELETE USING (auth.uid() = owner_id);

-- Realtime
-- To enable realtime, run:
-- alter publication supabase_realtime add table public.wagons;
