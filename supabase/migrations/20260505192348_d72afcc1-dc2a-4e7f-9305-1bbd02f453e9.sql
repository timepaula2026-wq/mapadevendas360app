
UPDATE storage.buckets SET public = false WHERE id = 'training-files';

DROP POLICY IF EXISTS "Anyone can view training files" ON storage.objects;
CREATE POLICY "Authenticated users can view training files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'training-files');
