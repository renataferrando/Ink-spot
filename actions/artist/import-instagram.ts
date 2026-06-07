"use server";

import { after } from "next/server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/instagram/crypto";
import { fetchMedia } from "@/lib/instagram/oauth";
import { classifyPortfolioItem } from "@/actions/portfolio/classify-styles";

export interface InstagramPreviewItem {
  id: string;
  media_url: string;
  caption?: string;
  timestamp: string;
  already_imported: boolean;
}

export async function previewInstagramMedia(): Promise<{
  items?: InstagramPreviewItem[];
  error?: string;
}> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id, instagram_token_encrypted")
    .eq("claimed_by_user_id", user.id)
    .single();

  if (!artist) return { error: "Artist not found." };
  if (!artist.instagram_token_encrypted)
    return { error: "Connect Instagram Business first to import posts." };

  let token: string;
  try {
    token = decryptToken(artist.instagram_token_encrypted as string);
  } catch {
    return { error: "Could not read Instagram token. Try reconnecting Instagram." };
  }

  let mediaPage;
  try {
    mediaPage = await fetchMedia(token, 20);
  } catch {
    return { error: "Could not fetch Instagram posts. Your token may have expired — try reconnecting." };
  }

  const { data: existing } = await admin
    .from("portfolio_items")
    .select("instagram_media_id")
    .eq("artist_id", artist.id)
    .not("instagram_media_id", "is", null);

  const importedIds = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (existing ?? []).map((r: any) => r.instagram_media_id as string),
  );

  const items: InstagramPreviewItem[] = mediaPage.data
    .filter((m) => m.media_type !== "VIDEO" && m.media_url)
    .map((m) => ({
      id: m.id,
      media_url: m.media_url!,
      caption: m.caption,
      timestamp: m.timestamp,
      already_imported: importedIds.has(m.id),
    }));

  return { items };
}

export interface ImportItem {
  ig_media_id: string;
  media_url: string;
  caption?: string;
  timestamp?: string;
}

export async function importInstagramItems(
  selected: ImportItem[],
): Promise<{ imported: number; error?: string }> {
  if (!selected.length) return { imported: 0 };

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id, handle")
    .eq("claimed_by_user_id", user.id)
    .single();
  if (!artist) return { imported: 0, error: "Artist not found." };

  const { count } = await admin
    .from("portfolio_items")
    .select("id", { count: "exact", head: true })
    .eq("artist_id", artist.id);
  const slots = 30 - (count ?? 0);
  if (slots <= 0) return { imported: 0, error: "Portfolio is full (30 images max)." };

  const toImport = selected.slice(0, slots);
  let imported = 0;

  for (const item of toImport) {
    let imageBuffer: ArrayBuffer;
    try {
      const res = await fetch(item.media_url);
      if (!res.ok) continue;
      imageBuffer = await res.arrayBuffer();
    } catch {
      continue;
    }

    const uuid = crypto.randomUUID();
    const path = `${artist.id}/${uuid}.jpg`;
    const { error: uploadError } = await admin.storage
      .from("portfolio")
      .upload(path, imageBuffer, { contentType: "image/jpeg", upsert: false });
    if (uploadError) continue;

    const {
      data: { publicUrl },
    } = admin.storage.from("portfolio").getPublicUrl(path);

    const { count: currentCount } = await admin
      .from("portfolio_items")
      .select("id", { count: "exact", head: true })
      .eq("artist_id", artist.id);

    const isFeatured = (currentCount ?? 0) === 0;

    const { data: newItem, error: insertError } = await admin
      .from("portfolio_items")
      .insert({
        artist_id: artist.id,
        image_url: publicUrl,
        instagram_media_id: item.ig_media_id,
        caption: item.caption ?? null,
        taken_at: item.timestamp ?? null,
        is_featured: isFeatured,
        sort_order: currentCount ?? 0,
        detected_styles: [],
      })
      .select("id")
      .single();

    if (insertError) continue;
    imported++;

    if (newItem?.id) after(() => classifyPortfolioItem(newItem.id));

    if (isFeatured) {
      await admin
        .from("artists")
        .update({ profile_image_url: publicUrl })
        .eq("id", artist.id)
        .is("profile_image_url", null);
    }
  }

  if (imported > 0) revalidateTag(`artist:${artist.handle}`, "max");

  return { imported };
}
