
-- Add ministry_name, dob_day, dob_month to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ministry_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob_day integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob_month integer;

-- Update handle_new_user to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, ministry_name, dob_day, dob_month)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'stacomzy20@gmail.com' THEN 'super-admin' ELSE 'customer' END,
    COALESCE(NEW.raw_user_meta_data->>'ministry_name', ''),
    (NEW.raw_user_meta_data->>'dob_day')::integer,
    (NEW.raw_user_meta_data->>'dob_month')::integer
  );
  RETURN NEW;
END;
$function$;
