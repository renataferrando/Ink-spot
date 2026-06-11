"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";

export type ToggleSaveResult =
  | { saved: boolean }
  | { requiresAuth: true };

export async function toggleSave(artistId: string): Promise<ToggleSaveResult> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { requiresAuth: true };

  const admin = getSupabaseAdminClientUntyped();

  // Check if already saved
  const { data: existing } = await admin
    .from("saved_artists")
    .select("artist_id")
    .eq("user_id", user.id)
    .eq("artist_id", artistId)
    .maybeSingle();

  if (existing) {
    await admin
      .from("saved_artists")
      .delete()
      .eq("user_id", user.id)
      .eq("artist_id", artistId);

    revalidatePath("/saved");
    return { saved: false };
  }

  await admin
    .from("saved_artists")
    .insert({ user_id: user.id, artist_id: artistId });

  revalidatePath("/saved");
  return { saved: true };
}

export async function getSavedArtistIds(userId: string): Promise<string[]> {
  const admin = getSupabaseAdminClientUntyped();
  const { data } = await admin
    .from("saved_artists")
    .select("artist_id")
    .eq("user_id", userId);

  return (data ?? []).map((r: { artist_id: string }) => r.artist_id);
}
