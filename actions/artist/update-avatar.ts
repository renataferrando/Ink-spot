"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const MAX_BYTES = 5 * 1024 * 1024;

async function getOwnedArtist() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, user: null, artist: null };

  const admin = getSupabaseAdminClient();
  const { data: artist, error } = await admin
    .from("artists")
    .select("id, handle, profile_image_url, cover_image_url")
    .eq("claimed_by_user_id", user.id)
    .single();

  if (error || !artist) return { error: "Artist not found." as const, user, artist: null };
  return { error: null, user, artist };
}

/** If `profile_image_url` is still empty, copy the first portfolio image (featured / sort order). */
export async function syncProfileImageFromPortfolio(): Promise<void> {
  const { error, artist } = await getOwnedArtist();
  if (error || !artist) return;

  if (artist.profile_image_url) return;

  const admin = getSupabaseAdminClient();
  const { data: first } = await admin
    .from("portfolio_items")
    .select("image_url")
    .eq("artist_id", artist.id)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!first?.image_url) return;

  await admin
    .from("artists")
    .update({ profile_image_url: first.image_url })
    .eq("id", artist.id);

  revalidateTag(`artist:${artist.handle}`, "max");
}

/**
 * Upload optional avatar + cover; always syncs profile image from portfolio when avatar omitted.
 * Redirects to /dashboard.
 */
export async function saveOnboardingAppearance(formData: FormData): Promise<{ error?: string }> {
  const ctx = await getOwnedArtist();
  if (ctx.error || !ctx.artist || !ctx.user) return { error: ctx.error ?? "Artist not found." };

  const supabase = await getSupabaseServerClient();
  const { artist } = ctx;

  const avatar = formData.get("avatar");
  const cover  = formData.get("cover");

  const upload = async (file: File, basename: "avatar" | "cover") => {
    if (!file || typeof file === "string" || file.size === 0) return null;
    if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
    if (file.size > MAX_BYTES) throw new Error("Image must be under 5 MB.");

    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const path = `${artist.id}/${basename}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (upErr) throw new Error(upErr.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    return publicUrl;
  };

  try {
    const avatarUrl =
      avatar instanceof File && avatar.size > 0 ? await upload(avatar, "avatar") : null;
    const coverUrl =
      cover instanceof File && cover.size > 0 ? await upload(cover, "cover") : null;

    const admin = getSupabaseAdminClient();
    const patch: { profile_image_url?: string; cover_image_url?: string } = {};
    if (avatarUrl) patch.profile_image_url = avatarUrl;
    if (coverUrl) patch.cover_image_url = coverUrl;

    if (Object.keys(patch).length > 0) {
      await admin.from("artists").update(patch).eq("id", artist.id);
    }

    await syncProfileImageFromPortfolio();
    revalidateTag(`artist:${artist.handle}`, "max");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed.";
    return { error: msg };
  }

  redirect("/dashboard");
}

export async function skipOnboardingAppearance(): Promise<void> {
  await syncProfileImageFromPortfolio();
  const ctx = await getOwnedArtist();
  if (ctx.artist) {
    revalidateTag(`artist:${ctx.artist.handle}`, "max");
  }
  redirect("/dashboard");
}
