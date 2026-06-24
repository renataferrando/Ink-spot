import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: handle } = await params; // id param is the handle, see ../route.ts
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ isSaved: false, isOwner: false });
  }

  const admin = getSupabaseAdminClientUntyped();
  const { data: artist } = await admin
    .from("artists")
    .select("id, claimed_by_user_id")
    .eq("handle", handle)
    .maybeSingle();

  if (!artist) {
    return Response.json({ isSaved: false, isOwner: false });
  }

  const { data: saved } = await admin
    .from("saved_artists")
    .select("artist_id")
    .eq("user_id", user.id)
    .eq("artist_id", artist.id)
    .maybeSingle();

  return Response.json({
    isSaved: !!saved,
    isOwner: artist.claimed_by_user_id === user.id,
  });
}
