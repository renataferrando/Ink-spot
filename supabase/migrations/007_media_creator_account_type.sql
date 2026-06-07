-- Migration 007: Add MEDIA_CREATOR to the instagram_account_type check constraint.
--
-- Instagram's API returns 'MEDIA_CREATOR' for older professional creator
-- accounts alongside 'BUSINESS' and 'CREATOR'. The original constraint in
-- migration 006 omitted it, causing persist_failed for MEDIA_CREATOR users.

ALTER TABLE artists
  DROP CONSTRAINT IF EXISTS artists_instagram_account_type_check;

ALTER TABLE artists
  ADD CONSTRAINT artists_instagram_account_type_check
    CHECK (instagram_account_type IN ('BUSINESS', 'CREATOR', 'PERSONAL', 'MEDIA_CREATOR'));
