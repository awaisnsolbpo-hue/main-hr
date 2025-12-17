-- Migration: Create applicant-cv storage bucket with RLS policies
-- This bucket stores CV files uploaded by applicants

-- Create storage bucket for applicant CVs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'applicant-cv', 
  'applicant-cv', 
  true,  -- Public bucket for easy access
  5242880,  -- 5MB file size limit
  ARRAY['application/pdf']  -- Only PDF files allowed
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf'];

-- Enable RLS on storage.objects (if not already enabled)
-- Note: RLS is typically enabled by default on storage.objects

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Public can read applicant CVs" ON storage.objects;

-- Policy: Allow authenticated users to upload files to their own folder
-- File path format: {user_id}/{timestamp}.pdf
CREATE POLICY "Users can upload their own CVs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'applicant-cv' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to read files in their own folder
CREATE POLICY "Users can read their own CVs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'applicant-cv' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete files in their own folder
CREATE POLICY "Users can delete their own CVs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'applicant-cv' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Allow public read access (since bucket is public)
-- This allows anyone with the URL to view the CV
CREATE POLICY "Public can read applicant CVs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'applicant-cv');

