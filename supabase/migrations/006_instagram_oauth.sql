-- Migration 006: Instagram Business OAuth alongside bio-code verification.
--
-- ADR 015 reintroduces Instagram OAuth (Graph API, instagram_business_basic
-- scope) as an OPTIONAL alternative verification path. Bio-code verification
-- (ADR 013) remains the default and covers Personal accounts.
--
-- This migration:
--   - Adds artists.verification_method ('bio_code' | 'instagram_oauth')
--   - Adds artists.instagram_account_type ('BUSINESS' | 'CREATOR' | 'PERSONAL')
--   - Adds artists.instagram_token_encrypted (AES-GCM ciphertext, base64)
--   - Repurposes existing artists.instagram_user_id to hold the real numeric
--     IG user ID returned by Graph API (was unused in the bio-code era).
--   - Backfills verification_method for already-claimed artists as 'bio_code'.
--
-- Safe to re-run.

ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS verification_method TEXT
    CHECK (verification_method IN ('bio_code', 'instagram_oauth'));

ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS instagram_account_type TEXT
    CHECK (instagram_account_type IN ('BUSINESS', 'CREATOR', 'PERSONAL'));

ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS instagram_token_encrypted TEXT;

-- Backfill: any artist already marked is_claimed=true before this migration
-- was claimed via the bio-code flow (the only flow that existed).
UPDATE artists
SET verification_method = 'bio_code'
WHERE is_claimed = TRUE AND verification_method IS NULL;

-- Index: find tokens approaching expiry so the refresh cron is fast.
CREATE INDEX IF NOT EXISTS artists_token_expiring
  ON artists (instagram_token_expires_at)
  WHERE instagram_token_encrypted IS NOT NULL;
