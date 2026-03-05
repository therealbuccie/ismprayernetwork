CREATE POLICY "Allow public uploads to book-covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'book-covers');

CREATE POLICY "Allow public read from book-covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-covers');