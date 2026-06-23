import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Get artist ID by looking up user
  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id")
    .eq("claimed_by_user_id", user.id)
    .single();
  if (!artist) return Response.json({ error: "Artist not found" }, { status: 404 });

  // Check upload cap
  const { count } = await admin
    .from("portfolio_items")
    .select("id", { count: "exact", head: true })
    .eq("artist_id", artist.id);
  if ((count ?? 0) >= 30) {
    return Response.json({ error: "Upload limit reached (30 images max)" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "File must be an image" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ error: "File must be under 5 MB" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const uuid = crypto.randomUUID();
  const path = `${artist.id}/${uuid}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("portfolio")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("portfolio").getPublicUrl(path);

  return Response.json({ url: publicUrl });
}
