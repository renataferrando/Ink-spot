-- Migration 010: security hardening from backend audit
-- Run in Supabase SQL Editor (already applied to the live DB; this file is for reproducibility).

-- ── artists: column-level write restriction ────────────────────────────────
-- RLS policies are row-level only. "artists_update_owner" (003) lets a claimed
-- owner UPDATE any column on their own row via the public PostgREST API,
-- bypassing app-level checks (admin claim approval, Zod validation, token
-- handling). Revoke UPDATE on the columns that must only change through the
-- service-role admin client.
REVOKE UPDATE (
  is_claimed,
  is_demo,
  claimed_by_user_id,
  instagram_user_id,
  instagram_access_token,
  instagram_token_expires_at
) ON artists FROM authenticated;

-- ── styles: enable RLS for consistency with every other table ─────────────
-- Static public reference data; was the only table without RLS enabled.
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "styles_select_public" ON styles FOR SELECT USING (TRUE);
