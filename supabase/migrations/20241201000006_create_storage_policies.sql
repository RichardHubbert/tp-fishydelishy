-- Create storage policies for restaurants bucket
-- This allows public uploads and reads for testing purposes

-- First, ensure the restaurants bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('restaurants', 'restaurants', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to restaurants bucket
CREATE POLICY "Public uploads to restaurants bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'restaurants');

-- Allow public reads from restaurants bucket
CREATE POLICY "Public reads from restaurants bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'restaurants');

-- Allow public updates to restaurants bucket (for replacing images)
CREATE POLICY "Public updates to restaurants bucket"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'restaurants')
WITH CHECK (bucket_id = 'restaurants');

-- Allow public deletes from restaurants bucket
CREATE POLICY "Public deletes from restaurants bucket"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'restaurants'); 