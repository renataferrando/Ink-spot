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
  const { data: existing, error: selectError } = await admin
    .from("saved_artists")
    .select("artist_id")
    .eq("user_id", user.id)
    .eq("artist_id", artistId)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Failed to look up saved artist: ${selectError.message}`);
  }

  if (existing) {
    const { error: deleteError } = await admin
      .from("saved_artists")
      .delete()
      .eq("user_id", user.id)
      .eq("artist_id", artistId);

    if (deleteError) {
      throw new Error(`Failed to unsave artist: ${deleteError.message}`);
    }

    revalidatePath("/saved");
    return { saved: false };
  }

  const { error: insertError } = await admin
    .from("saved_artists")
    .insert({ user_id: user.id, artist_id: artistId });

  if (insertError) {
    throw new Error(`Failed to save artist: ${insertError.message}`);
  }

  revalidatePath("/saved");
  return { saved: true };
}
