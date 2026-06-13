import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { PortfolioUploader } from "./portfolio-uploader";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
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
    .maybeSingle();

  if (!artist) redirect("/onboarding");

  const { data: portfolioItems } = await admin
    .from("portfolio_items")
    .select("id, image_url")
    .eq("artist_id", artist.id)
    .order("sort_order", { ascending: true });

  const initialItems = (portfolioItems ?? []).map((p) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    url: (p as any).image_url as string,
    name: "",
  }));

  const hasInstagramToken = Boolean(artist.instagram_token_encrypted);

  return (
    <PortfolioUploader
      hasInstagramToken={hasInstagramToken}
      initialItems={initialItems}
    />
  );
}
