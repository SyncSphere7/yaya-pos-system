-- Supabase Storage Setup for Logo Upload
-- Run this in your Supabase SQL editor after creating the project

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

-- Create policy to allow authenticated users to upload logos
CREATE POLICY "Allow authenticated users to upload logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow public read access to logos
CREATE POLICY "Allow public read access to logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

-- Create policy to allow authenticated users to update their logos
CREATE POLICY "Allow authenticated users to update logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to delete their logos
CREATE POLICY "Allow authenticated users to delete logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;