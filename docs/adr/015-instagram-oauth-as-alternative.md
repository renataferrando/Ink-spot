# ADR 015 — Instagram Business OAuth as an Alternative Verification Path

**Status:** Accepted
**Date:** 2026-06-02
**Supersedes-in-part:** ADR 013 (bio-code verification remains the default)

## Context

ADR 013 (2026-05-07) shipped bio-code verification as the only path to claiming
an artist profile because Instagram Basic Display had just been retired and
the Graph API required Meta App Review with no guaranteed timeline.

Six months in we have:

- A non-trivial cohort of artists with **Business** or **Creator** accounts
  who experience bio-code as friction ("why am I editing my bio for an app
  that already knows me?").
- A working Meta Business app with credentials and a documented review path.
- Confirmation from product that a verifiable real-time OAuth connection is
  worth the additional surface area for the artists who can use it (higher
  trust signal, no future "your code disappeared from your bio" support tickets).

We need to add OAuth **without** removing bio-code. The launch-market
demographic (personal accounts) still depends on bio-code, and OAuth can break
at any time when Meta deprecates or re-scopes endpoints.

## Decision

Offer two verification paths in parallel, owned by `artists.verification_method`:

- `instagram_oauth` — Graph API, `instagram_business_basic` scope, long-lived
  token stored encrypted, refreshed nightly by a cron job.
- `bio_code` — the existing ADR 013 flow, unchanged.

A column `artists.verification_method` records how the artist was verified.
Either method sets `is_claimed = true`; downstream code never branches on
method except in the UI ("Verified via Instagram" vs "Verified by bio code").

### What gets stored

| Column                              | Purpose                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `verification_method`               | `'bio_code'` \| `'instagram_oauth'` \| `null` (pre-claim)                        |
| `instagram_user_id`                 | Meta's numeric user id (previously unused; re-purposed for OAuth)                |
| `instagram_account_type`            | `'BUSINESS'` \| `'CREATOR'` \| `'PERSONAL'` (PERSONAL rejected at callback time) |
| `instagram_token_encrypted`         | AES-256-GCM ciphertext of the long-lived access token                            |
| `instagram_token_expires_at`        | When the token expires (used by refresh cron + UI)                               |

Tokens are encrypted at rest with `TOKEN_ENCRYPTION_KEY` (32 raw bytes,
base64-encoded in env). IV is per-encryption and stored with the ciphertext
as `<base64(iv)>.<base64(ct+tag)>`.

### Flow

1. Artist clicks **Connect Instagram** on `/onboarding/verify` or
   `/dashboard/profile`.
2. `GET /api/auth/instagram/start` sets a signed state cookie containing a
   nonce + user id + `next` path, then 302s to Meta's authorize URL.
3. Meta redirects to `GET /api/auth/instagram/callback?code=...&state=...`.
4. We verify the state (CSRF), exchange the code for a short-lived token,
   immediately swap that for a long-lived (~60-day) token, then call `/me` to
   get `id`, `username`, `account_type`.
5. We reject `PERSONAL` accounts (defense in depth — Meta should already block
   this at scope level) and `username !== artist.instagram_handle` mismatches.
6. We encrypt + persist the token and set `verification_method = 'instagram_oauth'`,
   `is_claimed = true`.

### Refresh

`GET /api/cron/refresh-instagram-tokens` runs daily, refreshes any token
within 14 days of expiry, and clears tokens that the upstream rejects
(artist revoked the app in Instagram settings). A revoked token does not
unverify the artist — they were verified at a moment in time — but the UI
surfaces a "Reconnect Instagram" affordance.

### Failure mode → bio-code fallback

If Meta's API is down, deprecated, or the artist's account is Personal, the
bio-code path on the same page still works. Both options live side-by-side on
`/onboarding/verify`; if OAuth env vars are unset, the OAuth section
disappears and the UI degrades to ADR-013 behavior with no code changes.

## Consequences

**Positive**
- Business/Creator artists get a one-click flow.
- The `instagram_business_basic` scope is read-only and stops at username +
  account type; we don't store followers or media beyond what's already in
  the bio-code flow.
- Bio-code remains a hard dependency-free fallback — if Meta breaks something
  tomorrow, every artist who's already verified stays verified.

**Negative**
- New surface for security failures: encrypted-token storage, refresh cron,
  state-cookie CSRF. The crypto is small enough to audit but is new.
- We now depend on Meta App Review for the OAuth path to work in production.
  Bio-code carries the launch if review stalls.
- A second column-set (`verification_method`, `instagram_account_type`,
  `instagram_token_encrypted`) must be kept in sync by every Server Action
  that touches `artists`.

## Operational requirements

Set in `.env.local` / production secrets:

- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `INSTAGRAM_REDIRECT_URI` — must exactly match what's registered in the Meta dashboard
- `TOKEN_ENCRYPTION_KEY` — generate with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

`instagramOAuthEnabled()` (in `lib/validations/env.ts`) returns `false` if any
of the four is missing and short-circuits the UI + API routes so dev
environments without Meta credentials behave exactly like ADR 013.
