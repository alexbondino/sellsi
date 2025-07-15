-- Storage policies for thumbnails bucket

-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images-thumbnails',
  'product-images-thumbnails',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Policy to allow Edge Functions to upload thumbnails
CREATE POLICY "Allow Edge Functions to upload thumbnails"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'product-images-thumbnails'
);

-- Policy to allow public read access to thumbnails
CREATE POLICY "Allow public read access to thumbnails"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images-thumbnails');

-- Policy to allow users to delete their own thumbnails
CREATE POLICY "Allow users to delete their own thumbnails"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images-thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to update their own thumbnails
CREATE POLICY "Allow users to update their own thumbnails"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images-thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
