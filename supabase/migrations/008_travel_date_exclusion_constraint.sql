-- Migration 008: Database-level enforcement of non-overlapping travel dates.
--
-- Required for EXCLUDE USING gist with non-geometric scalar types.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Each artist may have at most one guest_spot/traveling entry covering any
-- given moment. tstzrange(starts_at, ends_at, '[]') is used because the
-- app-layer dateRangesOverlap() treats both endpoints as inclusive.
-- ends_at = NULL becomes an upper-unbounded range (extends to +infinity).
-- Undated rows (starts_at IS NULL) are excluded from the constraint.
ALTER TABLE artist_locations
  ADD CONSTRAINT no_overlapping_travel
  EXCLUDE USING gist (
    artist_id WITH =,
    tstzrange(starts_at, ends_at, '[]') WITH &&
  )
  WHERE (kind <> 'home_base' AND starts_at IS NOT NULL);
