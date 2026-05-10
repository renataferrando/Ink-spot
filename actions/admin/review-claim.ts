"use server";

import { redirect } from "next/navigation";
import { env } from "@/lib/validations/env";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (env.ADMIN_USER_ID && user.id !== env.ADMIN_USER_ID) {
    redirect("/explore");
  }
  return user;
}

export async function approveClaim(claimId: string) {
  await requireAdmin();
  const admin = getSupabaseAdminClient();
  const { data: claim } = await admin
    .from("claims")
    .select("artist_id")
    .eq("id", claimId)
    .single();
  if (!claim) return;
  await admin.from("claims").update({ status: "approved" }).eq("id", claimId);
  await admin.from("artists").update({ is_claimed: true }).eq("id", claim.artist_id);
}

export async function rejectClaim(claimId: string) {
  await requireAdmin();
  const admin = getSupabaseAdminClient();
  await admin.from("claims").update({ status: "rejected" }).eq("id", claimId);
}
