import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";

// Daily cron: expire past guest_spot/traveling entries, re-promote home_base.
// Schedule: 59 23 * * * (daily at 23:59 UTC)
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  // 1. Expire entries where ends_at < NOW() and still current
  const { data: expired, error: expireError } = await admin
    .from("artist_locations")
    .update({ is_current: false })
    .lt("ends_at", new Date().toISOString())
    .eq("is_current", true)
    .select("artist_id");

  if (expireError) {
    return Response.json({ ok: false, error: expireError.message }, { status: 500 });
  }

  const expiredArtistIds = [...new Set((expired ?? []).map((r) => r.artist_id as string))];

  if (expiredArtistIds.length === 0) {
    return Response.json({ ok: true, expired: 0, promoted: 0 });
  }

  // 2. Batch-fetch every remaining location for the affected artists in one
  // round trip, then decide promotions in memory instead of looping queries.
  const { data: remaining, error: remainingError } = await admin
    .from("artist_locations")
    .select("id, artist_id, kind, is_current, created_at")
    .in("artist_id", expiredArtistIds)
    .order("created_at", { ascending: false });

  if (remainingError) {
    return Response.json({ ok: false, error: remainingError.message }, { status: 500 });
  }

  const byArtist = new Map<string, typeof remaining>();
  for (const loc of remaining ?? []) {
    const list = byArtist.get(loc.artist_id as string) ?? [];
    list.push(loc);
    byArtist.set(loc.artist_id as string, list);
  }

  const homeBaseIdsToPromote: string[] = [];
  for (const artistId of expiredArtistIds) {
    const locs = byArtist.get(artistId) ?? [];
    const hasCurrent = locs.some((l) => l.is_current);
    if (hasCurrent) continue;
    const homeBase = locs.find((l) => l.kind === "home_base");
    if (homeBase) homeBaseIdsToPromote.push(homeBase.id as string);
  }

  let promoted = 0;
  if (homeBaseIdsToPromote.length > 0) {
    const { error: promoteError } = await admin
      .from("artist_locations")
      .update({ is_current: true })
      .in("id", homeBaseIdsToPromote);

    if (promoteError) {
      return Response.json({ ok: false, error: promoteError.message }, { status: 500 });
    }
    promoted = homeBaseIdsToPromote.length;
  }

  return Response.json({
    ok: true,
    expired: expiredArtistIds.length,
    promoted,
  });
}
