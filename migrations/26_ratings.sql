-- Migration 26: Рейтинг пользователей
-- reviews table + bids completion columns + profiles aggregate columns + trigger + RLS

-- ===== Block 1: reviews table =====

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    tags TEXT[] DEFAULT '{}',
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (from_user_id, bid_id)
);

-- ===== Block 2: bids completion columns =====

ALTER TABLE public.bids
    ADD COLUMN IF NOT EXISTS completed_by_shipper BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS completed_by_owner BOOLEAN DEFAULT FALSE;

-- ===== Block 3: profiles aggregate columns =====

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- ===== Block 4: RLS on reviews =====

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;
CREATE POLICY "Authenticated users can view reviews" ON public.reviews
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
CREATE POLICY "Users can insert own reviews" ON public.reviews
    FOR INSERT WITH CHECK (from_user_id = auth.uid());

-- ===== Block 5: trigger function + trigger =====

CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET
        average_rating = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM public.reviews
            WHERE to_user_id = NEW.to_user_id
        ),
        review_count = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE to_user_id = NEW.to_user_id
        )
    WHERE id = NEW.to_user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_inserted ON public.reviews;
CREATE TRIGGER on_review_inserted
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_profile_rating();
