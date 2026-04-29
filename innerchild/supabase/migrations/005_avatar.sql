-- ============================================================
-- Migration 005 — Profile image support
-- ============================================================

-- 1. Add profile_image_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- 2. Create avatars storage bucket (run in Supabase dashboard if SQL doesn't work)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow authenticated users to upload their own avatar
CREATE POLICY "users upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "users update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Allow public read of avatars
CREATE POLICY "public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
