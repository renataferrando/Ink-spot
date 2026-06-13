import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";
import { embedArtist } from "@/lib/ai/embeddings";

// Weekly cron: generate/refresh style_embedding for artists missing one.
// Schedule: 0 4 * * 0 (Sundays at 04:00 UTC)
// Max 50 artists per run to stay within Vercel function timeout.
const BATCH_LIMIT = 50;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = getSupabaseAdminClientUntyped();

  // Fetch active artists with no embedding yet
  const { data: artists, error } = await admin
    .from("artists")
    .select("id, display_name, bio, primary_styles, style_description")
    .eq("is_active", true)
    .is("style_embedding", null)
    .limit(BATCH_LIMIT);

  if (error) {
    console.error("[cron/generate-embeddings] fetch error:", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!artists || artists.length === 0) {
    return Response.json({ ok: true, processed: 0, failed: 0 });
  }

  const artistIds = artists.map((a) => a.id);
  const { data: allItems } = await admin
    .from("portfolio_items")
    .select("artist_id, image_url")
    .in("artist_id", artistIds)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });

  const itemsByArtist: Record<string, { image_url: string }[]> = {};
  for (const item of allItems ?? []) {
    const id = (item as { artist_id: string; image_url: string }).artist_id;
    (itemsByArtist[id] ??= []).push({ image_url: (item as { image_url: string }).image_url });
  }

  let processed = 0;
  let failed = 0;

  for (const artist of artists) {
    await new Promise((r) => setTimeout(r, 1200)); // ~50 RPM stay well under Voyage limits
    try {
      const imageUrls = (itemsByArtist[artist.id] ?? [])
        .slice(0, 10)
        .map((i) => i.image_url)
        .filter(Boolean);

      const text = buildArtistText(artist as {
        display_name: string;
        bio: string | null;
        primary_styles: string[] | null;
        style_description: string | null;
      });
      const { embedding } = await embedArtist(text, imageUrls);

      const { error: updateError } = await admin
        .from("artists")
        .update({
          style_embedding: JSON.stringify(embedding),
          embedding_generated_at: new Date().toISOString(),
        })
        .eq("id", artist.id);

      if (updateError) {
        console.error(`[cron/generate-embeddings] update failed for ${artist.id}:`, updateError.message);
        failed++;
      } else {
        processed++;
      }
    } catch (err) {
      console.error(`[cron/generate-embeddings] error for ${artist.id}:`, (err as Error).message);
      failed++;
    }
  }

  return Response.json({ ok: true, processed, failed });
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
