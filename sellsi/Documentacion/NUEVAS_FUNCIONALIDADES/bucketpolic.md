CREATE POLICY "Allow authenticated users to upload 16wiy3a_0" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Allow authenticated users to delete their files 16wiy3a_0" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');