-- Combined geo + style similarity search.
-- Joins artist_locations for the artist's current location.
-- Called from /api/search Route Handler.
CREATE OR REPLACE FUNCTION search_artists(
  query_embedding  VECTOR(1024),
  user_lat         FLOAT8,
  user_lng         FLOAT8,
  max_distance_km  FLOAT8 DEFAULT 50,
  style_weight     FLOAT8 DEFAULT 0.6,
  limit_count      INT    DEFAULT 20
)
RETURNS TABLE (
  id                UUID,
  handle            TEXT,
  display_name      TEXT,
  profile_image_url TEXT,
  location_name     TEXT,
  primary_styles    TEXT[],
  distance_km       FLOAT8,
  style_similarity  FLOAT8,
  combined_score    FLOAT8
) AS $$
BEGIN
  RETURN QUERY
  WITH scored AS (
    SELECT
      a.id,
      a.handle,
      a.display_name,
      a.profile_image_url,
      al.location_name,
      a.primary_styles,
      111.045 * SQRT(
        POWER(al.lat - user_lat, 2) +
        POWER((al.lng - user_lng) * COS(RADIANS(user_lat)), 2)
      ) AS distance_km,
      1 - (a.style_embedding <=> query_embedding) AS style_similarity
    FROM artists a
    JOIN artist_locations al ON al.artist_id = a.id AND al.is_current = TRUE
    WHERE
      a.is_active       = TRUE
      AND a.style_embedding IS NOT NULL
      AND ABS(al.lat - user_lat) < (max_distance_km / 111.0)
  )
  SELECT
    s.*,
    (style_weight * s.style_similarity) +
    ((1 - style_weight) * GREATEST(0, 1 - (s.distance_km / max_distance_km)))
      AS combined_score
  FROM scored s
  WHERE s.distance_km <= max_distance_km
  ORDER BY combined_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;
