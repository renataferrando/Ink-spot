# InkSpot database schema diagram

Derived from [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql), [`002_search_function.sql`](../supabase/migrations/002_search_function.sql) (function only), and [`003_claimed_by_user.sql`](../supabase/migrations/003_claimed_by_user.sql).

**PNG / SVG export:** paste the Mermaid block below into [mermaid.live](https://mermaid.live) → **Actions → Export**.

---

## Entity–relationship (full column detail)

Diagram is wide by design; zoom or export to SVG for readability.

```mermaid
erDiagram
  AUTH_USERS {
    uuid id PK
  }

  STYLES {
    uuid id PK
    text slug UK
    text name
    text description
    timestamptz created_at
  }

  ARTISTS {
    uuid id PK
    text handle UK
    text display_name
    text bio
    text instagram_handle UK
    text instagram_user_id UK
    text instagram_access_token
    timestamptz instagram_token_expires_at
    text profile_image_url
    text cover_image_url
    text website_url
    text contact_email
    int years_experience
    vector1024 style_embedding
    postgres_text_array primary_styles
    text style_description
    boolean is_demo
    boolean is_claimed
    boolean is_active
    timestamptz embedding_generated_at
    uuid claimed_by_user_id FK
    timestamptz created_at
    timestamptz updated_at
  }

  ARTIST_LOCATIONS {
    uuid id PK
    uuid artist_id FK
    float8 lat
    float8 lng
    text location_name
    text kind
    timestamptz starts_at
    timestamptz ends_at
    boolean is_current
    text studio_name
    text notes
    timestamptz created_at
    timestamptz updated_at
  }

  PORTFOLIO_ITEMS {
    uuid id PK
    uuid artist_id FK
    text image_url
    text instagram_media_id
    text caption
    text alt_text
    vector1024 style_embedding
    postgres_text_array detected_styles
    float style_confidence
    text claude_description
    int width
    int height
    timestamptz taken_at
    boolean is_featured
    int sort_order
    timestamptz created_at
  }

  ARTIST_STYLES {
    uuid artist_id PK
    uuid style_id PK
    float confidence
    boolean is_manual
  }

  CLAIMS {
    uuid id PK
    uuid artist_id FK
    text instagram_user_id
    text instagram_handle
    text email
    text status
    timestamptz reviewed_at
    uuid reviewed_by FK
    text notes
    text verification_code
    timestamptz created_at
  }

  SEARCH_QUERIES {
    uuid id PK
    text query_text
    text query_image_url
    text query_type
    float8 user_lat
    float8 user_lng
    int result_count
    postgres_uuid_array top_artist_ids
    text session_id
    timestamptz created_at
  }

  SAVED_ARTISTS {
    uuid user_id PK
    uuid artist_id PK
    timestamptz created_at
  }

  QUERY_EMBEDDING_CACHE {
    text query_hash PK
    text query_text
    vector1024 embedding
    int hit_count
    timestamptz created_at
    timestamptz last_used_at
  }

  AI_ARTIST_SUMMARIES {
    uuid id PK
    uuid artist_id FK
    text content
    text model
    text prompt_hash
    boolean is_demo
    timestamptz generated_at
    timestamptz expires_at
  }

  AUTH_USERS ||--o{ ARTISTS : "claimed_by_user_id"
  ARTISTS ||--o{ ARTIST_LOCATIONS : "artist_id CASCADE"
  ARTISTS ||--o{ PORTFOLIO_ITEMS : "artist_id CASCADE"
  ARTISTS ||--o{ ARTIST_STYLES : "artist_id"
  STYLES ||--o{ ARTIST_STYLES : "style_id"
  ARTISTS ||--o{ CLAIMS : "artist_id CASCADE"
  AUTH_USERS ||--o{ CLAIMS : "reviewed_by"
  ARTISTS ||--o{ AI_ARTIST_SUMMARIES : "artist_id UNIQUE"
  ARTISTS ||--o{ SAVED_ARTISTS : "artist_id CASCADE"
  AUTH_USERS ||--o{ SAVED_ARTISTS : "user_id CASCADE"
```

**Type notes.** `vector1024` = Postgres **`VECTOR(1024)`** (pgvector extension). **`postgres_text_array`** = **`TEXT[]`**. **`postgres_uuid_array`** = **`UUID[]`**. **`claimed_by_user_id`** on **`artists`** is added in migration 003. **`instagram_user_id`** on **`claims`** is **`TEXT`** in the migration (stores submitting user id — column name retained from earlier flows).

`search_artists(...)` joins `artists` + `artist_locations` inside SQL — see migration 002 — and is not modeled as a table.

---

## Table index

| Table | Purpose |
| --- | --- |
| `auth.users` | Supabase Auth (magic link). |
| `artists` | Profile row + `style_embedding`; `claimed_by_user_id` → auth user (migration 003). |
| `artist_locations` | Nomadic geography (`home_base` / `guest_spot` / `traveling`). |
| `portfolio_items` | Public image URLs + per-item embeddings / styles / `sort_order`. |
| `styles` | Style catalog slug + name (seed rows in 001). |
| `artist_styles` | Artist ↔ style M:N (confidence / manual). |
| `claims` | Onboarding verification (`verification_code` in 003). |
| `saved_artists` | Composite PK `(user_id, artist_id)`. |
| `search_queries` | Search telemetry (no FK to `artists`). |
| `query_embedding_cache` | Text-query embedding cache by `query_hash`. |
| `ai_artist_summaries` | One row per artist (`artist_id` UNIQUE). |
