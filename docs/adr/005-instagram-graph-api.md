# ADR 005 — Instagram Graph API (Basic Display API Deprecated)

**Status:** Accepted  
**Date:** 2025-01-01

## Context

InkSpot authenticates tattoo artists via Instagram so their identity can be verified when they claim a profile. The original plan assumed Instagram Basic Display API, which allowed reading a personal account's media without app review.

Instagram Basic Display API was **officially deprecated on December 4, 2024** and no longer accepts new app registrations. Any app attempting to use it receives a "This app is not permitted" error.

## Decision

Use the **Instagram Graph API** with Business/Creator account permissions instead. This is now the only supported path for reading a user's Instagram media programmatically.

Required permissions:
- `instagram_business_basic` — read profile info and media
- `pages_show_list` — required by Meta for Business app type

The artist's Instagram account must be of type **Business** or **Creator** (not Personal). Artists using personal accounts must convert before connecting.

## Consequences

**Positive:**
- Graph API is the current, maintained, and feature-complete API.
- Supports all the data InkSpot needs: profile, media, captions, timestamps.
- Long-term token refresh (60-day tokens, renewable) is well-documented.

**Negative:**
- Requires **Meta App Review** for production use, which can take 1–3 weeks. Start this process before the Phase 3 launch target.
- Personal Instagram accounts cannot connect until they convert to Business/Creator type — this may add friction for some artists.
- For development: must use **Test Users** configured in the Meta Developer Dashboard rather than real accounts until App Review is approved.

## Migration from Basic Display API

Any existing code written against Basic Display API (`/me/media` with a user access token from the Basic Display product) must be rewritten to use Graph API endpoints:
- Profile: `GET /{ig-user-id}?fields=id,username,name,profile_picture_url`
- Media: `GET /{ig-user-id}/media?fields=id,caption,media_type,media_url,timestamp`

Encapsulate all Instagram API calls in `lib/instagram/` so a future API change only requires updating that directory.
