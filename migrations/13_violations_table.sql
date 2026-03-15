-- Migration 13: Violations table and sanction fields for chat protection system

-- violations table for logging each incident
CREATE TABLE IF NOT EXISTS public.violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  chat_id UUID REFERENCES public.bids(id),
  original_text TEXT NOT NULL,
  violation_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Profile fields for sanctions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS violation_points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chat_blocked_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_violation_at TIMESTAMPTZ;

-- RLS policies
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own violations" ON public.violations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own violations" ON public.violations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_violations_user_id ON public.violations(user_id);
CREATE INDEX IF NOT EXISTS idx_violations_created_at ON public.violations(created_at);
