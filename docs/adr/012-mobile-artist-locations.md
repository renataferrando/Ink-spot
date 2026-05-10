# ADR 012 — Mobile Artist Locations Model

**Status:** Accepted  
**Date:** 2026-04-28

## Context

The original `artists` schema stored a single `location_lat`, `location_lng`, and `location_name` directly on the row. This works for a studio with a fixed address but breaks for the reality of the Costa Rica tattoo scene: artists regularly travel between Santa Teresa, Tamarindo, Nosara, San José, and internationally for guest spots.

A single lat/lng cannot represent:
- A home base plus an active guest spot
- A schedule of upcoming travel (so clients know when to book)
- The transition between locations (cron-managed)

## Decision

Replace the flat location columns with a separate `artist_locations` table:

```
artist_locations
  id, artist_id, lat, lng, location_name
  kind: home_base | guest_spot | traveling
  starts_at, ends_at (nullable)
  is_current BOOLEAN  ← exactly one per artist (partial unique index)
  studio_name, notes
```

A **partial unique index** (`WHERE is_current = TRUE`) enforces that each artist has at most one current location at any time.

A **daily cron** (`/api/cron/rotate-locations`, runs at 23:59 UTC) expires past entries (`ends_at < NOW()`) and re-promotes the `home_base` if no other current location exists.

## Consequences

**Positive:**
- Artists can schedule upcoming travel and clients see "Next: Tamarindo, Dec 15–22" on the profile.
- Map search always uses `is_current = TRUE` — no stale coordinates.
- Clean separation of concerns: `artists` table holds identity; `artist_locations` holds presence.

**Negative:**
- One extra join in `search_artists()` and any artist-profile query.
- Cron failure means stale `is_current` until the next run (mitigated by manual toggle in dashboard).

## Cron failure mitigation

Artists can manually toggle `is_current` from their location dashboard. The `artist_locations_one_current` partial unique index prevents two `is_current = TRUE` rows — the toggle action first clears the old current, then sets the new one.
