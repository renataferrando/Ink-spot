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
  const { data: expired } = await admin
    .from("artist_locations")
    .update({ is_current: false })
    .lt("ends_at", new Date().toISOString())
    .eq("is_current", true)
    .select("artist_id");

  const expiredArtistIds = [...new Set((expired ?? []).map((r) => r.artist_id as string))];

  // 2. For each affected artist, promote their home_base if they have no current location
  let promoted = 0;
  for (const artistId of expiredArtistIds) {
    const { data: current } = await admin
      .from("artist_locations")
      .select("id")
      .eq("artist_id", artistId)
      .eq("is_current", true)
      .maybeSingle();

    if (!current) {
      const { data: homeBase } = await admin
        .from("artist_locations")
        .select("id")
        .eq("artist_id", artistId)
        .eq("kind", "home_base")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (homeBase) {
        await admin
          .from("artist_locations")
          .update({ is_current: true })
          .eq("id", homeBase.id);
        promoted++;
      }
    }
  }

  return Response.json({
    ok:       true,
    expired:  expiredArtistIds.length,
    promoted,
  });
}
