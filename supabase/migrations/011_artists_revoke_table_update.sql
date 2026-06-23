-- Migration 011: correct the artists UPDATE restriction from 010
-- Run in Supabase SQL Editor (already applied to the live DB; this file is for reproducibility).

-- 010's column-level REVOKE was a no-op: "authenticated" holds a table-level
-- UPDATE grant (Supabase's default `GRANT ALL ON ALL TABLES IN SCHEMA public`),
-- and a table-level grant supersedes column-level revokes in Postgres ACLs —
-- the row owner could still PATCH any column via the public PostgREST API.
--
-- No client-side code writes to `artists` directly (grep confirms the browser
-- client is only used for auth; every artist mutation goes through a server
-- action on the service-role admin client). So `authenticated` doesn't need
-- UPDATE on this table at all — revoke it at the table level.
REVOKE UPDATE ON artists FROM authenticated;
