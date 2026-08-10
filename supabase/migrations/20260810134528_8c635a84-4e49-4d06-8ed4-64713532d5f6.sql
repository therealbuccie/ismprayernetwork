CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NULL;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://ryitxoymayasdlabojsx.supabase.co/functions/v1/send-transactional-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
        )
      ),
      body := jsonb_build_object(
        'templateName', 'welcome-signup',
        'recipientEmail', NEW.email,
        'idempotencyKey', 'welcome-signup-' || NEW.id::text,
        'templateData', jsonb_build_object(
          'fullName', COALESCE(NEW.full_name, ''),
          'ministryName', COALESCE(NEW.ministry_name, '')
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'send_welcome_email_on_signup failed: %', SQLERRM;
  END;

  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_send_welcome_email ON public.profiles;

CREATE TRIGGER trg_send_welcome_email
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.send_welcome_email_on_signup();