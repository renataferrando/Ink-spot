import { z } from "zod";
import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";
import { streamArtistQA, type QAMessage } from "@/lib/ai/features/qa";
import { computeCurrentLocation } from "@/lib/location";
import { rateLimit, getClientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  question: z.string().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      }),
    )
    .max(10)
    .optional(),
});

type Props = { params: Promise<{ handle: string }> };

export async function POST(request: Request, { params }: Props) {
  const limited = await rateLimit("artist-qa", getClientIp(request));
  if (limited) return limited;

  const { handle } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid request", { status: 400 });
  }

  const { question, history = [] } = parsed.data;
  const admin = getSupabaseAdminClientUntyped();

  // ── Fetch artist ───────────────────────────────────────────────────────────
  const { data: artist, error } = await admin
    .from("artists")
    .select(
      `id, handle, display_name, bio, primary_styles, style_description,
       years_experience, website_url, is_demo, is_claimed, is_active,
       artist_locations(id, location_name, kind, starts_at, ends_at, is_current),
       portfolio_items(caption, is_featured, sort_order)`,
    )
    .eq("handle", handle)
    .eq("is_active", true)
    .single();

  if (error || !artist) {
    return new Response("Artist not found", { status: 404 });
  }

  // Q&A only available for non-demo claimed artists
  if (artist.is_demo || !artist.is_claimed) {
    return new Response("Q&A not available for this profile", { status: 403 });
  }

  // ── Build context ──────────────────────────────────────────────────────────
  const locs = Array.isArray(artist.artist_locations) ? artist.artist_locations : [];
  const current = computeCurrentLocation(locs);
  const upcoming = locs
    .filter(
      (l: Record<string, unknown>) =>
        l.starts_at && new Date(l.starts_at as string) > new Date(),
    )
    .sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        new Date(a.starts_at as string).getTime() - new Date(b.starts_at as string).getTime(),
    )
    .map((l: Record<string, unknown>) => l.location_name as string)
    .filter(Boolean);

  const portfolioItems = Array.isArray(artist.portfolio_items)
    ? (artist.portfolio_items as { caption: string | null; is_featured: boolean; sort_order: number }[])
    : [];
  const captions = portfolioItems
    .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || a.sort_order - b.sort_order)
    .map((p) => p.caption)
    .filter((c): c is string => !!c)
    .slice(0, 30);

  // ── Stream Q&A ────────────────────────────────────────────────────────────
  const stream = await streamArtistQA(
    {
      display_name: artist.display_name as string,
      bio: (artist.bio as string | null) ?? null,
      primary_styles: (artist.primary_styles as string[]) ?? [],
      style_description: (artist.style_description as string | null) ?? null,
      years_experience: (artist.years_experience as number | null) ?? null,
      website_url: (artist.website_url as string | null) ?? null,
      current_location: current?.location_name ?? null,
      upcoming_locations: upcoming,
      portfolio_captions: captions,
    },
    history as QAMessage[],
    question,
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
