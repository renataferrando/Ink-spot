"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isInstagramCdnUrl } from "@/lib/instagram/cdn";

const MAX_BYTES = 5 * 1024 * 1024;

async function getOwnedArtist() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  await admin.from("artists").update({ profile_image_url: first.image_url }).eq("id", artist.id);

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
  const cover = formData.get("cover");
  const avatarIgUrl = formData.get("avatar_ig_url") as string | null;
  const coverIgUrl = formData.get("cover_ig_url") as string | null;

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

  const uploadFromUrl = async (url: string, basename: "avatar" | "cover") => {
    if (!isInstagramCdnUrl(url)) throw new Error("Image URL is not from an allowed Instagram CDN.");
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not fetch image from Instagram.");
    const buffer = await res.arrayBuffer();
    const path = `${artist.id}/${basename}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, { contentType: "image/jpeg", upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    return publicUrl;
  };

  try {
    let avatarUrl: string | null = null;
    if (avatar instanceof File && avatar.size > 0) {
      avatarUrl = await upload(avatar, "avatar");
    } else if (avatarIgUrl) {
      avatarUrl = await uploadFromUrl(avatarIgUrl, "avatar");
    }

    let coverUrl: string | null = null;
    if (cover instanceof File && cover.size > 0) {
      coverUrl = await upload(cover, "cover");
    } else if (coverIgUrl) {
      coverUrl = await uploadFromUrl(coverIgUrl, "cover");
    }

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

export type UpdateAppearanceState = { error?: string; success?: boolean };

/**
 * Dashboard-side appearance editor.
 *
 * Supports three operations per slot (avatar, cover):
 *   - upload a new file when the input has a non-empty File,
 *   - remove the existing image when `remove_<slot>=true`,
 *   - leave the slot untouched otherwise.
 *
 * Returns state instead of redirecting (the edit page stays in place).
 */
export async function updateAppearance(
  _prev: UpdateAppearanceState,
  formData: FormData,
): Promise<UpdateAppearanceState> {
  const ctx = await getOwnedArtist();
  if (ctx.error || !ctx.artist || !ctx.user) return { error: ctx.error ?? "Artist not found." };

  const supabase = await getSupabaseServerClient();
  const { artist } = ctx;

  const upload = async (file: File, basename: "avatar" | "cover") => {
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
    // Cache-bust the public URL so the new file shows immediately.
    return `${publicUrl}?v=${Date.now()}`;
  };

  const avatar = formData.get("avatar");
  const cover = formData.get("cover");
  const removeAvatar = formData.get("remove_avatar") === "true";
  const removeCover = formData.get("remove_cover") === "true";

  const patch: { profile_image_url?: string | null; cover_image_url?: string | null } = {};

  try {
    if (removeAvatar) {
      patch.profile_image_url = null;
    } else if (avatar instanceof File && avatar.size > 0) {
      patch.profile_image_url = await upload(avatar, "avatar");
    }

    if (removeCover) {
      patch.cover_image_url = null;
    } else if (cover instanceof File && cover.size > 0) {
      patch.cover_image_url = await upload(cover, "cover");
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }

  if (Object.keys(patch).length === 0) {
    return { error: "Nothing to update." };
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("artists").update(patch).eq("id", artist.id);
  if (error) return { error: error.message };

  revalidateTag(`artist:${artist.handle}`, "max");
  revalidatePath(`/artist/${artist.handle}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/account");

  return { success: true };
}
