import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ intent?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const admin = getSupabaseAdminClient();
    const { data: artist } = await admin
      .from("artists")
      .select("handle")
      .eq("claimed_by_user_id", user.id)
      .maybeSingle();

    redirect(artist ? "/dashboard" : "/explore");
  }

  const { intent } = await searchParams;
  const validIntent = intent === "artist" || intent === "fan" ? intent : "returning";

  return <LoginForm intent={validIntent} />;
}
