-- Simple Storage Bucket Creation for YaYa POS
-- Run this in your Supabase SQL Editor

-- Create the logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos', 
  'logos', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Allow public read access
CREATE POLICY "Public read access for logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update their logos
CREATE POLICY "Authenticated users can update logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their logos
CREATE POLICY "Authenticated users can delete logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' AND 
  auth.role() = 'authenticated'
);