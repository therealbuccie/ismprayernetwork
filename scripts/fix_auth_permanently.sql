-- Permanent Auth & Email Confirmation Fix for ISM Prayer Network
-- Run this once in Supabase Dashboard -> SQL Editor

-- 1. Confirm all existing unconfirmed users who were blocked after migration
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email_confirmed_at IS NULL;

-- 2. Make check_email_exists case-insensitive and whitespace-safe
CREATE OR REPLACE FUNCTION public.check_email_exists(lookup_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(lookup_email))
  );
$$;

-- 3. Auto-confirm new signups at the DB level so ministers are never locked out
CREATE OR REPLACE FUNCTION public.auto_confirm_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_auth_user ON auth.users;
CREATE TRIGGER trg_auto_confirm_auth_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_auth_user();
