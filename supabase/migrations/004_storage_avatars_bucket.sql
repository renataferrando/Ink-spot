-- Avatars / cover images: public reads; writes limited to the owning artist (claimed_by_user_id).
-- Object key shape: {artist_id}/avatar.{ext} or {artist_id}/cover.{ext}
-- Run in Supabase SQL Editor after portfolio bucket exists; idempotent where possible.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  public            = EXCLUDED.public,
  file_size_limit   = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── Policies (drop+create for idempotency) ───────────────────────────────────
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_insert_owner" ON storage.objects;
CREATE POLICY "avatars_insert_owner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.artists
      WHERE artists.id = split_part(name, '/', 1)::UUID
        AND artists.claimed_by_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "avatars_update_owner" ON storage.objects;
CREATE POLICY "avatars_update_owner"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.artists
      WHERE artists.id = split_part(name, '/', 1)::UUID
        AND artists.claimed_by_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "avatars_delete_owner" ON storage.objects;
CREATE POLICY "avatars_delete_owner"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.artists
      WHERE artists.id = split_part(name, '/', 1)::UUID
        AND artists.claimed_by_user_id = (SELECT auth.uid())
    )
  );
