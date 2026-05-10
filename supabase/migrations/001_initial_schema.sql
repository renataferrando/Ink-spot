-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Helper: updated_at trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── styles ────────────────────────────────────────────────────────────────────
CREATE TABLE styles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO styles (slug, name) VALUES
  ('blackwork',       'Blackwork'),
  ('fine-line',       'Fine Line'),
  ('realism',         'Realism'),
  ('watercolor',      'Watercolor'),
  ('traditional',     'Traditional'),
  ('neo-traditional', 'Neo Traditional'),
  ('geometric',       'Geometric'),
  ('minimalist',      'Minimalist'),
  ('japanese',        'Japanese'),
  ('tribal',          'Tribal'),
  ('illustrative',    'Illustrative'),
  ('dotwork',         'Dotwork');

-- ── artists ───────────────────────────────────────────────────────────────────
-- Location is in artist_locations; use WHERE is_current = TRUE for geo queries.
CREATE TABLE artists (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle                     TEXT UNIQUE NOT NULL,
  display_name               TEXT NOT NULL,
  bio                        TEXT,
  instagram_handle           TEXT UNIQUE,
  instagram_user_id          TEXT UNIQUE,
  instagram_access_token     TEXT,
  instagram_token_expires_at TIMESTAMPTZ,
  profile_image_url          TEXT,
  cover_image_url            TEXT,
  website_url                TEXT,
  contact_email              TEXT,
  years_experience           INT,
  style_embedding            VECTOR(1024),
  primary_styles             TEXT[]  DEFAULT '{}',
  style_description          TEXT,
  is_demo                    BOOLEAN DEFAULT FALSE,
  is_claimed                 BOOLEAN DEFAULT FALSE,
  is_active                  BOOLEAN DEFAULT TRUE,
  embedding_generated_at     TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX artists_style_embedding_hnsw
  ON artists USING hnsw (style_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
CREATE INDEX artists_handle ON artists (handle);
CREATE INDEX artists_active  ON artists (is_active) WHERE is_active = TRUE;

CREATE TRIGGER artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── artist_locations ──────────────────────────────────────────────────────────
CREATE TABLE artist_locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id     UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  lat           FLOAT8 NOT NULL,
  lng           FLOAT8 NOT NULL,
  location_name TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('home_base', 'guest_spot', 'traveling')),
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  is_current    BOOLEAN DEFAULT FALSE,
  studio_name   TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce at most one is_current per artist
CREATE UNIQUE INDEX artist_locations_one_current
  ON artist_locations (artist_id) WHERE is_current = TRUE;

CREATE INDEX artist_locations_geo
  ON artist_locations (lat, lng) WHERE is_current = TRUE;

CREATE INDEX artist_locations_dates
  ON artist_locations (artist_id, starts_at, ends_at);

CREATE TRIGGER artist_locations_updated_at
  BEFORE UPDATE ON artist_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── portfolio_items ───────────────────────────────────────────────────────────
CREATE TABLE portfolio_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id          UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  image_url          TEXT NOT NULL,
  instagram_media_id TEXT,
  caption            TEXT,
  alt_text           TEXT,
  style_embedding    VECTOR(1024),
  detected_styles    TEXT[] DEFAULT '{}',
  style_confidence   FLOAT4,
  claude_description TEXT,
  width              INT,
  height             INT,
  taken_at           TIMESTAMPTZ,
  is_featured        BOOLEAN DEFAULT FALSE,
  sort_order         INT DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX portfolio_items_artist_id ON portfolio_items (artist_id);
CREATE INDEX portfolio_items_featured  ON portfolio_items (artist_id, is_featured)
  WHERE is_featured = TRUE;
CREATE INDEX portfolio_items_style_embedding_hnsw
  ON portfolio_items USING hnsw (style_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── artist_styles ─────────────────────────────────────────────────────────────
CREATE TABLE artist_styles (
  artist_id  UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  style_id   UUID NOT NULL REFERENCES styles(id)  ON DELETE CASCADE,
  confidence FLOAT4  DEFAULT 1.0,
  is_manual  BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (artist_id, style_id)
);

CREATE INDEX artist_styles_style_id ON artist_styles (style_id);

-- ── claims ────────────────────────────────────────────────────────────────────
CREATE TABLE claims (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id         UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  instagram_handle  TEXT NOT NULL,
  email             TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at       TIMESTAMPTZ,
  reviewed_by       UUID REFERENCES auth.users(id),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX claims_artist_id ON claims (artist_id);
CREATE INDEX claims_status    ON claims (status) WHERE status = 'pending';

-- ── search_queries ────────────────────────────────────────────────────────────
CREATE TABLE search_queries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text      TEXT,
  query_image_url TEXT,
  query_type      TEXT NOT NULL,
  user_lat        FLOAT8,
  user_lng        FLOAT8,
  result_count    INT,
  top_artist_ids  UUID[],
  session_id      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX search_queries_created_at ON search_queries (created_at DESC);
CREATE INDEX search_queries_type       ON search_queries (query_type);

-- ── saved_artists ─────────────────────────────────────────────────────────────
CREATE TABLE saved_artists (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id  UUID NOT NULL REFERENCES artists(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, artist_id)
);

CREATE INDEX saved_artists_user_id ON saved_artists (user_id);

-- ── query_embedding_cache ─────────────────────────────────────────────────────
CREATE TABLE query_embedding_cache (
  query_hash   TEXT PRIMARY KEY,
  query_text   TEXT NOT NULL,
  embedding    VECTOR(1024) NOT NULL,
  hit_count    INT DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX query_embedding_cache_used
  ON query_embedding_cache (last_used_at DESC);

-- ── ai_artist_summaries ───────────────────────────────────────────────────────
CREATE TABLE ai_artist_summaries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id    UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  model        TEXT NOT NULL,
  prompt_hash  TEXT NOT NULL,
  is_demo      BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  CONSTRAINT ai_artist_summaries_unique UNIQUE (artist_id)
);

CREATE INDEX ai_artist_summaries_expires ON ai_artist_summaries (expires_at);
CREATE INDEX ai_artist_summaries_artist  ON ai_artist_summaries (artist_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE artists             ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_locations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_styles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims              ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_artists       ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_embedding_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_artist_summaries ENABLE ROW LEVEL SECURITY;

-- artists: public read active
CREATE POLICY "artists_select_public" ON artists FOR SELECT USING (is_active = TRUE);
CREATE POLICY "artists_update_owner"  ON artists FOR UPDATE USING (
  instagram_user_id = (
    SELECT raw_user_meta_data->>'instagram_user_id' FROM auth.users WHERE id = auth.uid()
  )
);

-- artist_locations: public read for active artists; owner manages
CREATE POLICY "artist_locations_select_public" ON artist_locations FOR SELECT USING (
  artist_id IN (SELECT id FROM artists WHERE is_active = TRUE)
);
CREATE POLICY "artist_locations_manage_owner" ON artist_locations FOR ALL USING (
  artist_id IN (
    SELECT id FROM artists WHERE instagram_user_id = (
      SELECT raw_user_meta_data->>'instagram_user_id' FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- portfolio_items: public read; owner manages
CREATE POLICY "portfolio_items_select_public"  ON portfolio_items FOR SELECT USING (TRUE);
CREATE POLICY "portfolio_items_manage_owner"   ON portfolio_items FOR ALL USING (
  artist_id IN (
    SELECT id FROM artists WHERE instagram_user_id = (
      SELECT raw_user_meta_data->>'instagram_user_id' FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- artist_styles: public read
CREATE POLICY "artist_styles_select_public" ON artist_styles FOR SELECT USING (TRUE);

-- claims: authenticated insert
CREATE POLICY "claims_insert_authenticated" ON claims FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- search_queries: anonymous insert
CREATE POLICY "search_queries_insert" ON search_queries FOR INSERT WITH CHECK (TRUE);

-- saved_artists: each user manages their own
CREATE POLICY "saved_artists_own" ON saved_artists FOR ALL USING (user_id = auth.uid());

-- query_embedding_cache: service role only (no public policies)
-- ai_artist_summaries: public read for non-demo
CREATE POLICY "ai_summaries_public_read" ON ai_artist_summaries FOR SELECT USING (is_demo = FALSE);
