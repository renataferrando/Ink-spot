-- Portfolio images: public reads; writes limited to the owning artist.
-- Object key shape: {artist_id}/{uuid}.{ext}
-- Idempotent: safe to re-run.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio',
  'portfolio',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── Policies ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "portfolio_public_read" ON storage.objects;
CREATE POLICY "portfolio_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio');

DROP POLICY IF EXISTS "portfolio_insert_owner" ON storage.objects;
CREATE POLICY "portfolio_insert_owner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio'
    AND EXISTS (
      SELECT 1 FROM public.artists
      WHERE artists.id = split_part(name, '/', 1)::UUID
        AND artists.claimed_by_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "portfolio_update_owner" ON storage.objects;
CREATE POLICY "portfolio_update_owner"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'portfolio'
    AND EXISTS (
      SELECT 1 FROM public.artists
      WHERE artists.id = split_part(name, '/', 1)::UUID
        AND artists.claimed_by_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "portfolio_delete_owner" ON storage.objects;
CREATE POLICY "portfolio_delete_owner"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'portfolio'
    AND EXISTS (
      SELECT 1 FROM public.artists
      WHERE artists.id = split_part(name, '/', 1)::UUID
        AND artists.claimed_by_user_id = (SELECT auth.uid())
    )
  );
