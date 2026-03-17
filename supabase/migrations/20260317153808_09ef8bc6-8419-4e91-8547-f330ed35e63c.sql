
-- Backfill: insert existing profiles into newsletter_subscribers (skip duplicates)
INSERT INTO public.newsletter_subscribers (email, full_name, is_active)
SELECT p.email, p.full_name, true
FROM public.profiles p
WHERE p.email IS NOT NULL AND p.email != ''
ON CONFLICT (email) DO NOTHING;

-- Create trigger function to auto-subscribe new users
CREATE OR REPLACE FUNCTION public.auto_subscribe_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    INSERT INTO public.newsletter_subscribers (email, full_name, is_active)
    VALUES (NEW.email, COALESCE(NEW.full_name, ''), true)
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS trg_auto_subscribe_new_user ON public.profiles;
CREATE TRIGGER trg_auto_subscribe_new_user
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_subscribe_new_user();
