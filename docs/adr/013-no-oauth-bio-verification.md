# ADR 013 — No Instagram OAuth: Magic Link + Bio Code Verification

**Status:** Accepted  
**Date:** 2026-05-07

## Context

The original Phase 3 design used Instagram OAuth (Basic Display API) to authenticate tattoo artists and import their portfolios. On December 4, 2024, Instagram Basic Display API was officially shut down — it no longer accepts new app registrations.

The Graph API remains available but requires:
- A **Business or Creator** Instagram account (not personal)
- **Meta App Review** — a manual process that takes 1–3 weeks and may be rejected
- Ongoing compliance with Meta's platform policies

The majority of tattoo artists in the launch market (Santa Teresa, Costa Rica) use personal Instagram accounts. Requiring a business account upgrade is significant friction. Meta App Review delays would block the Phase 3 launch entirely.

## Decision

Replace Instagram OAuth with a three-part flow that has no Meta dependency:

1. **Supabase magic-link auth** — artist enters email, receives a one-click sign-in link, no password needed. Supabase Auth handles sessions (default 1-week expiry).

2. **Bio code ownership verification** — to prove they own an Instagram handle, the artist pastes a short code (e.g. `inkspot-7f3a91`) into their IG bio. The server fetches the public profile page and checks the `og:description` meta tag for the code. On match, `artists.is_claimed = true`.

3. **Manual review fallback** — for artists who can't or won't edit their bio. They submit a contact form; a pending `claims` row is created; the admin reviews it at `/admin/claims` and approves via a Server Action.

Portfolio photos are uploaded directly to **Supabase Storage** (bucket: `portfolio`, public read) rather than imported from Instagram.

## Instagram as optional enhancement

The `lib/instagram/` modules, `instagram_access_token` column, and Instagram webhook remain in the codebase as scaffolding for a future optional feature: connecting Instagram to import existing posts for style classification (Phase 4+). This is explicitly opt-in and not required to create or verify a profile.

## Consequences

**Positive:**
- No Meta dependency for the core onboarding flow.
- Works for personal and business accounts equally.
- No App Review waiting period — can ship Phase 3 immediately.
- Simpler codebase: no OAuth state machine, no token encryption for Phase 3.

**Negative:**
- Bio code verification requires the artist to temporarily edit their IG bio — minor friction, but self-serve and instant.
- Server-side Instagram page scraping can break if Instagram changes its HTML. Mitigated by graceful fallback to manual review and by targeting the stable `og:description` meta tag.
- Manual review creates operational overhead (admin must check `/admin/claims`). Acceptable at MVP scale.

## Geocoding

Google Geocoding API was also dropped in favor of **OpenCage** (opencagedata.com) — 2,500 requests/day free tier, no credit card required. Artist address resolution is the only geocoding use case in Phase 3, and typical MVP volume is well within the free cap.
