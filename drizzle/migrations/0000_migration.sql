CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN RETURN NULL; END IF;
  BEGIN
    PERFORM net.http_post(
      url := 'https://ryitxoymayasdlabojsx.supabase.co/functions/v1/send-welcome-email',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('profileId', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'send_welcome_email_on_signup failed: %', SQLERRM;
  END;
  RETURN NULL;
END;
$function$;