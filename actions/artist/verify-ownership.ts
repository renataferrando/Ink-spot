"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function verifyOwnership(): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const handle = cookieStore.get("inkspot_handle")?.value;
  if (!handle) redirect("/onboarding");

  const admin = getSupabaseAdminClient();

  // Get artist + pending claim
  const { data: artist } = await admin
    .from("artists")
    .select("id, instagram_handle")
    .eq("handle", handle)
    .single();
  if (!artist) return { error: "Artist not found." };

  const { data: claim } = await admin
    .from("claims")
    .select("id")
    .eq("artist_id", artist.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!claim) return { error: "No pending verification found." };

  // Mark as claimed
  await admin.from("artists").update({ is_claimed: true }).eq("id", artist.id);
  await admin.from("claims").update({ status: "approved" }).eq("id", claim.id);

  redirect("/onboarding/location");
}

export async function submitManualReview(formData: FormData): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const handle = cookieStore.get("inkspot_handle")?.value;
  if (!handle) redirect("/onboarding");

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id, instagram_handle")
    .eq("handle", handle)
    .single();
  if (!artist) return { error: "Artist not found." };

  const contact = formData.get("contact") as string;
  const note = formData.get("note") as string;
  if (!contact?.trim()) return { error: "Please provide a contact method." };

  // Update existing claim or insert new one
  const { data: existing } = await admin
    .from("claims")
    .select("id")
    .eq("artist_id", artist.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    await admin
      .from("claims")
      .update({
        notes: `Manual review requested. Contact: ${contact}. Note: ${note ?? ""}`,
      })
      .eq("id", existing.id);
  } else {
    await admin.from("claims").insert({
      artist_id: artist.id,
      instagram_user_id: user.id,
      instagram_handle: artist.instagram_handle ?? "",
      status: "pending",
      notes: `manual_review — Contact: ${contact}. Note: ${note ?? ""}`,
    });
  }

  return {};
}
