-- Migration 01: Initial Schema Setup

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('shipper', 'owner', 'demo')) NOT NULL,
    company TEXT,
    inn TEXT,
    phone TEXT,
    bids_limit INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Requests Table
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shipperId UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    shipperInn TEXT,
    shipperName TEXT,
    shipperPhone TEXT,
    stationFrom TEXT NOT NULL,
    stationTo TEXT NOT NULL,
    cargoType TEXT NOT NULL,
    wagonType TEXT NOT NULL,
    totalWagons INTEGER NOT NULL,
    fulfilledWagons INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('open', 'completed')) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requests are viewable by everyone" ON public.requests FOR SELECT USING (true);
CREATE POLICY "Shippers can insert their own requests" ON public.requests FOR INSERT WITH CHECK (auth.uid() = "shipperId");
CREATE POLICY "Shippers can update own requests" ON public.requests FOR UPDATE USING (auth.uid() = "shipperId");

-- 3. Bids Table (also acts as chats)
CREATE TABLE IF NOT EXISTS public.bids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requestId UUID REFERENCES public.requests(id) ON DELETE CASCADE,
    ownerId UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ownerName TEXT,
    ownerPhone TEXT,
    price NUMERIC NOT NULL,
    wagons INTEGER NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'canceled')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bids are viewable by everyone" ON public.bids FOR SELECT USING (true);
CREATE POLICY "Owners can insert their own bids" ON public.bids FOR INSERT WITH CHECK (auth.uid() = "ownerId");
CREATE POLICY "Owners and Shippers can update bids" ON public.bids FOR UPDATE USING (
    auth.uid() = "ownerId"
    OR "requestId" IN (
        SELECT id FROM public.requests
        WHERE "shipperInn" = (SELECT inn FROM public.profiles WHERE id = auth.uid())
    )
);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES public.bids(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages are viewable by chat participants" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Participants can insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 5. Realtime Setup
-- To enable realtime subscriptions, run these commands (or configure in Supabase Dashboard):
-- alter publication supabase_realtime add table public.requests;
-- alter publication supabase_realtime add table public.bids;
-- alter publication supabase_realtime add table public.messages;
