"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function resolveArtistHandle(userId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieHandle = cookieStore.get("inkspot_handle")?.value;
  if (cookieHandle) return cookieHandle;

  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("artists")
    .select("handle")
    .eq("claimed_by_user_id", userId)
    .maybeSingle();
  return data?.handle ?? null;
}

export async function verifyOwnership(
  redirectTo = "/onboarding/location",
): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const handle = await resolveArtistHandle(user.id);
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
    .select("id, verification_code, instagram_handle")
    .eq("artist_id", artist.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!claim) return { error: "No pending verification found." };

  // Server-side re-verification: confirm the code is still present in the bio
  const igHandle = (claim.instagram_handle as string | null) ?? (artist.instagram_handle as string | null);
  const code = claim.verification_code as string | null;
  if (igHandle && code) {
    try {
      const res = await fetch(`https://www.instagram.com/${igHandle}/`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; InkSpot/1.0; +https://inkspot.app)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (res.ok) {
        const html = await res.text();
        if (!html.includes(code)) {
          return { error: "Verification code not found in bio." };
        }
      }
    } catch {
      return { error: "Could not reach Instagram to verify. Please try again." };
    }
  }

  // Mark as claimed
  await admin.from("artists").update({ is_claimed: true }).eq("id", artist.id);
  await admin.from("claims").update({ status: "approved" }).eq("id", claim.id);

  redirect(redirectTo);
}

export async function submitManualReview(formData: FormData): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const handle = await resolveArtistHandle(user.id);
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
