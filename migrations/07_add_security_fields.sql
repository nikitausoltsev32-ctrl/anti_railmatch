-- Migration 07: Add Security Fields to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leakage_attempts INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_profile_views INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_view_reset TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
