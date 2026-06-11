import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";
import { generateArtistSummary } from "@/lib/ai/features/summary";

// Weekly cron: generate/refresh AI summaries for claimed non-demo artists.
// Schedule: 0 5 * * 0 (Sundays at 05:00 UTC, after generate-embeddings at 04:00)
// Max 50 artists per run to stay within Vercel function timeout.
const BATCH_LIMIT = 50;
const CONCURRENCY = 3;

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = getSupabaseAdminClientUntyped();

  // Fetch claimed, non-demo artists whose summary is missing or expired
  const now = new Date().toISOString();
  const { data: artists, error } = await admin
    .from("artists")
    .select("id, display_name, bio, primary_styles, style_description, years_experience, is_demo")
    .eq("is_active", true)
    .eq("is_claimed", true)
    .eq("is_demo", false)
    .limit(BATCH_LIMIT);

  if (error) {
    console.error("[cron/regenerate-summaries] fetch error:", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!artists || artists.length === 0) {
    return Response.json({ ok: true, processed: 0, failed: 0 });
  }

  // Filter to artists whose summary is missing or expired
  const { data: existingSummaries } = await admin
    .from("ai_artist_summaries")
    .select("artist_id, expires_at")
    .in(
      "artist_id",
      artists.map((a: { id: string }) => a.id),
    )
    .gt("expires_at", now);

  const freshIds = new Set(
    (existingSummaries ?? []).map((s: { artist_id: string }) => s.artist_id),
  );
  const stale = (artists as Array<{ id: string } & Record<string, unknown>>).filter(
    (a) => !freshIds.has(a.id),
  );

  if (stale.length === 0) {
    return Response.json({ ok: true, processed: 0, failed: 0, skipped: artists.length });
  }

  let processed = 0;
  let failed = 0;

  // Process in batches of CONCURRENCY
  for (let i = 0; i < stale.length; i += CONCURRENCY) {
    const chunk = stale.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (artist) => {
        try {
          const { data: portfolioItems } = await admin
            .from("portfolio_items")
            .select("caption")
            .eq("artist_id", artist.id)
            .eq("is_featured", true)
            .order("sort_order", { ascending: true })
            .limit(10);

          const captions = ((portfolioItems ?? []) as { caption: string | null }[])
            .map((p) => p.caption)
            .filter((c): c is string => !!c);

          const result = await generateArtistSummary({
            id: artist.id as string,
            display_name: artist.display_name as string,
            bio: (artist.bio as string | null) ?? null,
            primary_styles: (artist.primary_styles as string[]) ?? [],
            style_description: (artist.style_description as string | null) ?? null,
            years_experience: (artist.years_experience as number | null) ?? null,
            is_demo: false,
            captions,
          });

          const { error: upsertError } = await admin
            .from("ai_artist_summaries")
            .upsert(result, { onConflict: "artist_id" });

          if (upsertError) {
            console.error(
              `[cron/regenerate-summaries] upsert failed for ${artist.id}:`,
              upsertError.message,
            );
            failed++;
          } else {
            processed++;
          }
        } catch (err) {
          console.error(
            `[cron/regenerate-summaries] error for ${artist.id}:`,
            (err as Error).message,
          );
          failed++;
        }
      }),
    );
  }

  return Response.json({ ok: true, processed, failed });
}
