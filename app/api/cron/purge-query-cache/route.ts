import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";

// Monthly cron: delete query_embedding_cache rows unused for 30+ days.
// Schedule: 0 5 1 * * (1st of each month at 05:00 UTC)
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = getSupabaseAdminClientUntyped();

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("query_embedding_cache")
    .delete()
    .lt("last_used_at", cutoff)
    .select("query_hash");

  if (error) {
    console.error("[cron/purge-query-cache] error:", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, purged: (data ?? []).length });
}
