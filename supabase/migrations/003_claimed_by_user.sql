-- Migration 003: add claimed_by_user_id + verification_code
-- Run in Supabase SQL Editor (already applied to the live DB; this file is for reproducibility).

-- Artists: link artist row to the Supabase auth user who claimed it
ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS artists_claimed_by
  ON artists (claimed_by_user_id)
  WHERE claimed_by_user_id IS NOT NULL;

-- Claims: dedicated column for bio-code (avoids collision with freeform notes)
ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS verification_code TEXT;

CREATE INDEX IF NOT EXISTS claims_verification_code
  ON claims (verification_code)
  WHERE verification_code IS NOT NULL;

-- ── Updated RLS policies ──────────────────────────────────────────────────────
-- The original policies used instagram_user_id (Instagram OAuth flow, now removed).
-- Replace with claimed_by_user_id = auth.uid() so the artist can update their own row.

-- Artists: owner update
DROP POLICY IF EXISTS "artists_update_owner" ON artists;
CREATE POLICY "artists_update_owner" ON artists FOR UPDATE
  USING (claimed_by_user_id = auth.uid());

-- Portfolio items: owner manage (tied to claimed_by_user_id via join)
DROP POLICY IF EXISTS "portfolio_items_manage_owner" ON portfolio_items;
CREATE POLICY "portfolio_items_manage_owner" ON portfolio_items FOR ALL
  USING (
    artist_id IN (
      SELECT id FROM artists WHERE claimed_by_user_id = auth.uid()
    )
  );

-- Artist locations: owner manage (same pattern)
DROP POLICY IF EXISTS "artist_locations_manage_owner" ON artist_locations;
CREATE POLICY "artist_locations_manage_owner" ON artist_locations FOR ALL
  USING (
    artist_id IN (
      SELECT id FROM artists WHERE claimed_by_user_id = auth.uid()
    )
  );
