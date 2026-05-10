import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { PortfolioManager } from "./portfolio-manager";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id")
    .eq("claimed_by_user_id", user.id)
    .single();
  if (!artist) redirect("/onboarding");

  const { data: items } = await admin
    .from("portfolio_items")
    .select("id, image_url, alt_text, is_featured, sort_order")
    .eq("artist_id", artist.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      <h1 className="text-xl font-medium">Portfolio</h1>
      <PortfolioManager initialItems={items ?? []} />
    </div>
  );
}
