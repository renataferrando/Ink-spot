# InkSpot

A tattoo artist discovery platform for Costa Rica. Artists claim a profile, upload their portfolio, and share their travel schedule. Clients browse, save, and reach out.

Dark studio aesthetic. Mobile-first. AI-powered search.

---

## What it does

### For clients
- **Explore** — browse artists near you on a map or as a scrollable list
- **Search** — natural-language AI search ("geometric artist available in June near Tamarindo")
- **Artist profiles** — portfolio, bio, styles, current location, upcoming travel
- **Save** — bookmark favorite artists, accessible across sessions
- **Inquire** — direct contact via email or Instagram DM

### For artists
- **Claim a profile** — verify ownership by dropping a short code in your Instagram bio for 60 seconds
- **Dashboard** — analytics snapshot, portfolio management, location/travel calendar
- **Portfolio** — upload up to 30 photos; import directly from Instagram
- **Locations** — set a home base and add guest spots or travel dates so clients know where you'll be
- **AI Q&A** — each artist profile has a Claude-powered Q&A panel where clients can ask questions about style, booking, and availability

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Database & Auth | Supabase (Postgres + Row Level Security + magic-link auth) |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Embeddings | Voyage AI (`voyage-3`) |
| Maps | MapLibre GL + OpenFreeMap tiles |
| Geocoding | Google Maps Geocoding API |
| Instagram | Instagram Graph API (OAuth + media import) |
| Rate limiting | Upstash Redis |
| Styling | Tailwind CSS v4 + Geist Sans + JetBrains Mono |

---

## Project structure

```
app/
  (marketing)/      Landing page
  (app)/            Client-facing app (explore, search, saved, account)
  (artist)/         Public artist profile pages
  (auth)/           Authenticated flows
    login/          Magic-link sign-in
    onboarding/     Artist claim flow (handle → verify IG → avatar → portfolio → location)
    dashboard/      Artist dashboard (home, inquiries, portfolio, preview)
      profile/      Edit bio, handle, styles, Instagram
      portfolio/    Upload / delete / import from Instagram
      locations/    Home base + travel dates
  api/
    ai/             Search assistant + per-artist Q&A (streaming)
    auth/instagram/ Instagram OAuth callback
    cron/           Embedding generation + AI summary refresh
    search/         Keyword + vector search
    upload/         Image upload to Supabase Storage

components/
  artist/           ArtistCard, ArtistProfile, LocationTimeline, …
  layout/           TopBar, BottomNav, DesktopNav, PageContainer
  ai/               Streaming chat UI, Q&A panel
  map/              MapLibre artists map, location picker
  forms/            Google Places autocomplete

lib/
  ai/               Claude client, embeddings, search queries, style classifier
  supabase/         Server + admin clients
  instagram/        CDN helpers
  location.ts       computeCurrentLocation, dateRangesOverlap
  ui/               Shared class constants (button variants, field classes)

actions/            Server Actions (artist profile, locations, portfolio, auth, saved)
types/              Shared TypeScript types (ArtistPublic, ArtistLocation, styles)
scripts/            One-off scripts (seed data, batch embedding generation)
```

---

## Routes

| Path | Description |
|---|---|
| `/` | Marketing landing |
| `/explore` | Map + artist list |
| `/search` | AI-assisted search |
| `/saved` | Saved artists (requires auth) |
| `/account` | Sign-in / account management |
| `/artist/[handle]` | Public artist profile |
| `/login` | Magic-link sign-in |
| `/onboarding` | Artist claim + setup (multi-step) |
| `/dashboard` | Artist dashboard |
| `/dashboard/profile` | Edit artist profile |
| `/dashboard/portfolio` | Manage portfolio photos |
| `/dashboard/locations` | Manage home base + travel dates |

---

## Location system

Each artist has a **home base** — the city where they tattoo by default. On top of that they can add travel entries:

- **Guest spot** — a formal booking at another studio. Requires start and end dates, optionally a studio name.
- **Traveling** — on the road without a fixed studio. Requires start and end dates.

Both types override the home base as the artist's current location for the duration of the date range. When the end date passes, `computeCurrentLocation` automatically reverts to the home base. End dates are required so the system always knows when the artist is home again.

---

## AI features

### Search assistant (`/api/ai/search-assistant`)
Streaming Claude response that interprets natural-language queries, extracts style/location/date filters, runs a hybrid keyword + vector search against the artist database, and returns a ranked list with explanations.

### Artist Q&A (`/api/ai/artist-qa/[handle]`)
Per-artist streaming Q&A. Claude answers questions about a specific artist using their bio, styles, location timeline, and an AI-generated summary as context.

### Style classifier (cron)
A cron job runs Claude over newly uploaded portfolio images to detect tattoo styles and populate `detected_styles` on each portfolio item. These feed into the search embeddings.

### Embeddings (cron)
A cron job builds a text representation for each artist and generates a Voyage AI embedding stored in Postgres (`pgvector`). Semantic search queries the vector column via cosine similarity.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values.

```bash
cp .env.example .env.local
```

| Variable | Required for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Everything |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Everything |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB writes |
| `ANTHROPIC_API_KEY` | AI search, Q&A, style classification |
| `VOYAGE_API_KEY` | Embedding generation |
| `INSTAGRAM_APP_ID` | Artist Instagram verification + import |
| `INSTAGRAM_APP_SECRET` | Artist Instagram verification + import |
| `INSTAGRAM_REDIRECT_URI` | Instagram OAuth callback |
| `TOKEN_ENCRYPTION_KEY` | Encrypting stored Instagram tokens |
| `NEXT_PUBLIC_MAP_TILES_URL` | Map (defaults to OpenFreeMap — free, no token needed) |
| `OPENCAGE_API_KEY` | Address → coordinates in onboarding |
| `NEXT_PUBLIC_APP_URL` | Absolute URLs, OG images |
| `UPSTASH_REDIS_REST_URL` | Rate limiting (optional in dev) |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (optional in dev) |
| `CRON_SECRET` | Vercel cron job verification |

Rate limiting is skipped when Upstash env vars are absent, so local dev works without Redis.

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Design

Dark-mode only. Design tokens are in `app/globals.css`. Conventions — token semantics, the two-layer styling rule, typography — are documented in [`docs/design.md`](docs/design.md).

Accent color: `#6467f2`. Fonts: Geist Sans (body) + JetBrains Mono (metadata, labels, badges).
