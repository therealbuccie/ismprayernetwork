CREATE POLICY "Users upload own report files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'report-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own report files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'report-uploads' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));