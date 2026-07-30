ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, ministry_name, dob_day, dob_month, country)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'stacomzy20@gmail.com' THEN 'super-admin' ELSE 'customer' END,
    COALESCE(NEW.raw_user_meta_data->>'ministry_name', ''),
    (NEW.raw_user_meta_data->>'dob_day')::integer,
    (NEW.raw_user_meta_data->>'dob_month')::integer,
    NULLIF(NEW.raw_user_meta_data->>'country', '')
  );
  RETURN NEW;
END;
$function$;

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
  IF NEW.full_name IS NULL OR position(' ' in NEW.full_name) = 0 THEN
    lname := '';
  ELSE
    lname := COALESCE(NULLIF(trim(substring(NEW.full_name from position(' ' in NEW.full_name) + 1)), ''), '');
  END IF;

  IF EXISTS (SELECT 1 FROM public.contacts c WHERE lower(c.email) = lower(NEW.email)) THEN
    UPDATE public.contacts c
    SET first_name = CASE WHEN COALESCE(c.first_name, '') = '' THEN fname ELSE c.first_name END,
        last_name  = CASE WHEN COALESCE(c.last_name, '') = '' THEN lname ELSE c.last_name END,
        country    = COALESCE(NULLIF(NEW.country, ''), c.country),
        updated_at = now()
    WHERE lower(c.email) = lower(NEW.email);
  ELSE
    INSERT INTO public.contacts (first_name, last_name, email, country, source)
    VALUES (fname, lname, lower(NEW.email), NULLIF(NEW.country, ''), 'platform_signup');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_to_contacts_trigger ON public.profiles;
CREATE TRIGGER sync_profile_to_contacts_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_contacts();

DROP TRIGGER IF EXISTS sync_profile_update_to_contacts_trigger ON public.profiles;
CREATE TRIGGER sync_profile_update_to_contacts_trigger
AFTER UPDATE OF full_name, country, email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_contacts();