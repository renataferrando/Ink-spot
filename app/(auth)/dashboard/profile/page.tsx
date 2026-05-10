import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Edit profile" };

export default async function ProfilePage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("bio, website_url, contact_email, years_experience")
    .eq("claimed_by_user_id", user.id)
    .single();
  if (!artist) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="text-xl font-medium">Edit profile</h1>
      <ProfileForm
        defaultBio={artist.bio ?? ""}
        defaultWebsite={artist.website_url ?? ""}
        defaultEmail={artist.contact_email ?? ""}
        defaultYears={artist.years_experience ?? undefined}
      />
    </div>
  );
}
