"use server";

import { after } from "next/server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { classifyPortfolioItem } from "@/actions/portfolio/classify-styles";

export async function addPortfolioItem(
  imageUrl: string,
  altText?: string,
): Promise<{ id?: string; error?: string }> {
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
  if (!artist) return { error: "Artist not found." };

  // Check cap
  const { count } = await admin
    .from("portfolio_items")
    .select("id", { count: "exact", head: true })
    .eq("artist_id", artist.id);
  if ((count ?? 0) >= 30) return { error: "Upload limit reached (30 images max)" };

  // First item is featured
  const isFeatured = (count ?? 0) === 0;

  const { data: newItem, error: insertError } = await admin
    .from("portfolio_items")
    .insert({
      artist_id: artist.id,
      image_url: imageUrl,
      alt_text: altText || null,
      is_featured: isFeatured,
      sort_order: count ?? 0,
      detected_styles: [],
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };
  if (!newItem?.id) return { error: "Failed to create portfolio item." };

  after(() => classifyPortfolioItem(newItem.id));

  if (isFeatured) {
    await admin
      .from("artists")
      .update({ profile_image_url: imageUrl })
      .eq("id", artist.id)
      .is("profile_image_url", null);
  }

  revalidateTag(`artist:${artist.handle}`, "max");
  return { id: newItem.id };
}

export async function removePortfolioItem(itemId: string): Promise<{ error?: string }> {
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
  if (!artist) return { error: "Artist not found." };

  await admin.from("portfolio_items").delete().eq("id", itemId).eq("artist_id", artist.id);

  revalidateTag(`artist:${artist.handle}`, "max");
  return {};
}
