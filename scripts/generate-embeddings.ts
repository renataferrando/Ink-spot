/**
 * Phase 4.2 batch embeddings: generate style_embedding for all artists that
 * either have no embedding yet or whose embedding_generated_at is stale.
 *
 * Run: npm run embeddings
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY in .env.local
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

// Inline the embedding logic here so we don't import Next.js env validation
// (which requires NEXT_PUBLIC_* vars that aren't needed in scripts).
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MULTIMODAL_API_URL = "https://api.voyageai.com/v1/multimodalembeddings";
const MODEL = "voyage-multimodal-3";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const voyageKey = process.env.VOYAGE_API_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!voyageKey) {
  console.error("Set VOYAGE_API_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function embedArtist(text: string, imageUrls: string[]): Promise<number[]> {
  if (imageUrls.length === 0) {
    // Text-only path
    const res = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${voyageKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, input: [text], input_type: "document" }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Voyage text embed failed (${res.status}): ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as { data: { embedding: number[] }[] };
    return json.data[0].embedding;
  }

  // Multimodal path
  const content = [
    { type: "text" as const, text },
    ...imageUrls.slice(0, 10).map((u) => ({ type: "image_url" as const, url: u })),
  ];

  const res = await fetch(VOYAGE_MULTIMODAL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${voyageKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      inputs: [{ content }],
      input_type: "document",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage multimodal embed failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}

function buildArtistText(artist: {
  display_name: string;
  bio: string | null;
  primary_styles: string[] | null;
  style_description: string | null;
}): string {
  const parts: string[] = [`Tattoo artist: ${artist.display_name}`];
  if (artist.primary_styles?.length) {
    parts.push(`Styles: ${artist.primary_styles.join(", ")}`);
  }
  if (artist.style_description) {
    parts.push(artist.style_description);
  }
  if (artist.bio) {
    parts.push(artist.bio);
  }
  return parts.join(". ");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const forceAll = args.includes("--force");

  console.log(`[embeddings] Starting batch${forceAll ? " (--force: re-generate all)" : ""}…`);

  // Fetch artists that need embeddings
  let query = supabase
    .from("artists")
    .select(
      "id, display_name, bio, primary_styles, style_description, embedding_generated_at, is_active",
    )
    .eq("is_active", true);

  if (!forceAll) {
    query = query.is("style_embedding", null);
  }

  const { data: artists, error } = await query;

  if (error) {
    console.error("[embeddings] Failed to fetch artists:", error.message);
    process.exit(1);
  }

  if (!artists || artists.length === 0) {
    console.log("[embeddings] No artists need embeddings. Done.");
    return;
  }

  console.log(`[embeddings] Processing ${artists.length} artist(s)…`);

  let succeeded = 0;
  let failed = 0;
  let totalTokens = 0;

  for (const artist of artists) {
    try {
      // Fetch up to 10 featured portfolio images for multimodal embedding
      const { data: items } = await supabase
        .from("portfolio_items")
        .select("image_url")
        .eq("artist_id", artist.id)
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(10);

      const imageUrls = (items ?? []).map((i) => i.image_url).filter(Boolean);
      const text = buildArtistText(artist);

      console.log(
        `  → ${artist.display_name} (${imageUrls.length} images)…`,
      );

      const embedding = await embedArtist(text, imageUrls);
      totalTokens += text.split(/\s+/).length; // rough token estimate for logging

      const { error: updateError } = await supabase
        .from("artists")
        .update({
          style_embedding: JSON.stringify(embedding),
          embedding_generated_at: new Date().toISOString(),
        })
        .eq("id", artist.id);

      if (updateError) {
        console.error(`  ✗ ${artist.display_name}: DB update failed — ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✓ ${artist.display_name}`);
        succeeded++;
      }

      // Respect Voyage free-tier rate limits (~100 req/min)
      await sleep(650);
    } catch (err) {
      console.error(`  ✗ ${artist.display_name}: ${(err as Error).message}`);
      failed++;
      await sleep(2000);
    }
  }

  console.log(
    `\n[embeddings] Done. ✓ ${succeeded} succeeded · ✗ ${failed} failed · ~${totalTokens} tokens`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

main();
