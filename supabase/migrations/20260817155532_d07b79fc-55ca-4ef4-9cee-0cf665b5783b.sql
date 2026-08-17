ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS ministerial_role text,
  ADD COLUMN IF NOT EXISTS city text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, ministry_name, dob_day, dob_month, country, phone, title, ministerial_role, city)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'stacomzy20@gmail.com' THEN 'super-admin' ELSE 'customer' END,
    COALESCE(NEW.raw_user_meta_data->>'ministry_name', ''),
    (NEW.raw_user_meta_data->>'dob_day')::integer,
    (NEW.raw_user_meta_data->>'dob_month')::integer,
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'title', ''),
    NULLIF(NEW.raw_user_meta_data->>'ministerial_role', ''),
    NULLIF(NEW.raw_user_meta_data->>'city', '')
  );
  RETURN NEW;
END;
$function$;