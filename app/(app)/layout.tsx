import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { TopBar } from "@/components/layout/top-bar";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let showDashboard = false;
  if (user) {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("artists")
      .select("id")
      .eq("claimed_by_user_id", user.id)
      .maybeSingle();
    showDashboard = Boolean(data);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DesktopNav showDashboard={showDashboard} />
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <BottomNav />
    </div>
  );
}
