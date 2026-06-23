-- supabase/migrations/009_ai_summaries.sql
-- Cached AI-generated artist summaries (Phase 5.5)

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

-- Public read for non-demo summaries; writes via service role only
ALTER TABLE ai_artist_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_summaries_public_read"
  ON ai_artist_summaries FOR SELECT
  USING (is_demo = FALSE);
