import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";
import { embedQuery, embedArtist } from "./embeddings";

// ── Query normalisation ───────────────────────────────────────────────────────

function normalise(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "");
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Text query → embedding (with cache) ──────────────────────────────────────
// Returns a 1024-dim embedding for a plain text search query.
// Hits the query_embedding_cache table first; calls Voyage only on a miss.
export async function getQueryEmbedding(text: string): Promise<number[]> {
  const normalised = normalise(text);
  const hash = await sha256(normalised);

  const admin = getSupabaseAdminClientUntyped();

  // Cache read
  const { data: cached } = await admin
    .from("query_embedding_cache")
    .select("embedding")
    .eq("query_hash", hash)
    .maybeSingle();

  if (cached?.embedding) {
    // Async cache hit update — don't await, never block the response
    void admin
      .from("query_embedding_cache")
      .update({ last_used_at: new Date().toISOString() })
      .eq("query_hash", hash);

    return cached.embedding as number[];
  }

  // Cache miss — call Voyage
  const { embedding } = await embedQuery(normalised);

  // Async cache write — don't await, failure is non-critical
  void admin.from("query_embedding_cache").upsert(
    {
      query_hash: hash,
      query_text: normalised,
      embedding: JSON.stringify(embedding),
      hit_count: 1,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "query_hash" },
  );

  return embedding;
}

// ── Image query → embedding ───────────────────────────────────────────────────
// Generates a multimodal embedding from an image URL (no cache — every image is unique).
export async function getImageQueryEmbedding(imageUrl: string): Promise<number[]> {
  const { embedding } = await embedArtist("tattoo reference image for style matching", [imageUrl]);
  return embedding;
}
