ALTER FUNCTION public.move_to_dlq(text,text,bigint,jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text,integer,integer) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text,jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text,bigint) SET search_path = public, pgmq;

DROP POLICY IF EXISTS "Authenticated users can submit prayer requests" ON public.prayer_requests;
CREATE POLICY "Authenticated users can submit prayer requests" ON public.prayer_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can submit testimonies" ON public.testimonies;
CREATE POLICY "Authenticated users can submit testimonies" ON public.testimonies
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Hide other members' emails on prayer slots
REVOKE SELECT ON public.prayer_slots FROM authenticated, anon;
GRANT SELECT (id, user_id, user_name, slot_date, slot_time, status, reminder_sent, created_at) ON public.prayer_slots TO authenticated;

-- Storage
DROP POLICY IF EXISTS "Allow public uploads to book-covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from book-covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view POP" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload POP" ON storage.objects;
CREATE POLICY "Users upload own POP" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pop-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners and admins view POP" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pop-uploads' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));