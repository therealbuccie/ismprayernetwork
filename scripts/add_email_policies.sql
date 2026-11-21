ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage email_send_log" ON public.email_send_log;
CREATE POLICY "Admins can manage email_send_log" ON public.email_send_log FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage email_send_state" ON public.email_send_state;
CREATE POLICY "Admins can manage email_send_state" ON public.email_send_state FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage email_unsubscribe_tokens" ON public.email_unsubscribe_tokens;
CREATE POLICY "Admins can manage email_unsubscribe_tokens" ON public.email_unsubscribe_tokens FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage suppressed_emails" ON public.suppressed_emails;
CREATE POLICY "Admins can manage suppressed_emails" ON public.suppressed_emails FOR ALL USING (is_admin(auth.uid()));
