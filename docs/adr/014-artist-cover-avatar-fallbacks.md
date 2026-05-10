# ADR-014 — Public profile cover & avatar fallbacks

## Context

The app does not require Instagram OAuth. Artists upload portfolio work to Supabase Storage. Public `/artist/{handle}` needs a cover band and avatar without a dedicated CDN for every user on day one.

## Decision

1. **`cover_image_url`** — optional explicit upload; if absent, use **first portfolio image** (by featured + sort order); if no portfolio, render **initials on a neutral surface** (no broken `<img>`).

2. **`profile_image_url`** — optional explicit upload (onboarding Step 6 `avatars` bucket); if absent after onboarding, copy **URL of first portfolio item** into `profile_image_url` when present; UI still **falls back to initials** when URL is null.

3. **Storage** — dedicated **`avatars`** bucket (`{artist_id}/avatar.*`, `{artist_id}/cover.*`), public read, write restricted to owner via `claimed_by_user_id` = `auth.uid()` (see migration `004_storage_avatars_bucket.sql`).

## Consequences

- No dependency on Meta for imagery.
- Seed / legacy rows may still have null `profile_image_url`; list and profile components must keep initials fallback until backfilled.

## Status

Accepted — aligns with Phase 3 Stage 3.4 / 3.7 in `PLAN.md`.
