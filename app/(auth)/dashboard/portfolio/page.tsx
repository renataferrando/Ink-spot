import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageColumn } from "@/components/layout/page-container";
import { PortfolioManager } from "./portfolio-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Portfolio" };

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
    .single();
  if (!artist) redirect("/onboarding");

  const { data: items } = await admin
    .from("portfolio_items")
    .select("id, image_url, alt_text, is_featured, sort_order")
    .eq("artist_id", artist.id)
    .order("sort_order", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasInstagramToken = Boolean((artist as any).instagram_token_encrypted);

  return (
    <PageColumn className="space-y-6 py-10">
      <h1 className="text-xl font-medium">Portfolio</h1>
      <PortfolioManager initialItems={items ?? []} hasInstagramToken={hasInstagramToken} />
    </PageColumn>
  );
}
