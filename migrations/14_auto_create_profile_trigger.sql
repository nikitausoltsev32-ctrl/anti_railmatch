-- Migration 14: Auto-create profile on new auth user registration
-- This trigger ensures every new user gets a profile row automatically,
-- regardless of whether the Edge Function or client-side upsert succeeds.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, company, phone, inn)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Пользователь'),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'shipper' THEN 'shipper'
      ELSE 'owner'
    END,
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'inn', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop if exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- One-time fix: create profiles for existing orphaned auth users (no profile row)
INSERT INTO public.profiles (id, name, role, company, phone, inn)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', 'Пользователь'),
  CASE
    WHEN u.raw_user_meta_data->>'role' = 'shipper' THEN 'shipper'
    ELSE 'owner'
  END,
  COALESCE(u.raw_user_meta_data->>'company', ''),
  COALESCE(u.raw_user_meta_data->>'phone', ''),
  COALESCE(u.raw_user_meta_data->>'inn', '')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
