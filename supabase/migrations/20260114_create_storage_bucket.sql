-- =====================================================
-- STORAGE BUCKET SETUP: store-media
-- =====================================================
-- Execute this in Supabase SQL Editor AFTER creating the table
-- =====================================================

-- 1. Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-media', 'store-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Anyone can view store media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload store media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their business media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their business media" ON storage.objects;

-- 3. Create Storage Policies

-- Anyone can view store media (public bucket)
CREATE POLICY "Anyone can view store media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'store-media');

-- Authenticated users can upload store media
CREATE POLICY "Authenticated users can upload store media"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'store-media' 
        AND auth.role() = 'authenticated'
    );

-- Users can update their business media
CREATE POLICY "Users can update their business media"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'store-media'
        AND auth.role() = 'authenticated'
    );

-- Users can delete their business media
CREATE POLICY "Users can delete their business media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'store-media'
        AND auth.role() = 'authenticated'
    );

-- =====================================================
-- FOLDER STRUCTURE:
-- store-media/{business_id}/logo.png
-- store-media/{business_id}/banner.jpg
-- =====================================================

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'store-media';

-- Verify table was created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'store_settings';

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'store_settings';

-- Verify policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'store_settings';
