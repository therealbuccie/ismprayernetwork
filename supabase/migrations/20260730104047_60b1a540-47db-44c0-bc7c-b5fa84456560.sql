CREATE OR REPLACE FUNCTION public.sync_profile_to_contacts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fname text;
  lname text;
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  fname := COALESCE(NULLIF(split_part(COALESCE(NEW.full_name, ''), ' ', 1), ''), split_part(NEW.email, '@', 1));
  lname := NULLIF(trim(substring(COALESCE(NEW.full_name, '') from position(' ' in COALESCE(NEW.full_name, '')) + 1)), '');
  IF NEW.full_name IS NULL OR position(' ' in NEW.full_name) = 0 THEN
    lname := '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.contacts c WHERE lower(c.email) = lower(NEW.email)) THEN
    INSERT INTO public.contacts (first_name, last_name, email, source)
    VALUES (fname, COALESCE(lname, ''), lower(NEW.email), 'platform_signup');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_to_contacts_trigger ON public.profiles;
CREATE TRIGGER sync_profile_to_contacts_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_contacts();