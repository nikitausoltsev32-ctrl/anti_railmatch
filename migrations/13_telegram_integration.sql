-- ============================================
-- Migration 13: Telegram Integration
-- ============================================

-- 1. Add Telegram fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS telegram_link_token TEXT,
  ADD COLUMN IF NOT EXISTS telegram_link_token_expires TIMESTAMPTZ;

-- 2. Expand role constraint to include 'admin'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('shipper', 'owner', 'demo', 'admin'));

-- 3. Broadcasts history table
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  sent_by UUID REFERENCES public.profiles(id),
  sent_at TIMESTAMPTZ DEFAULT now(),
  recipients_count INTEGER DEFAULT 0
);

-- RLS for broadcasts: only admin can insert/read
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage broadcasts" ON public.broadcasts
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
