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
    const { data, error } = await admin
      .from("artists")
      .select("id")
      .eq("claimed_by_user_id", user.id)
      .maybeSingle();
    if (error) console.error("AppLayout: failed to look up artist for nav", error);
    showDashboard = Boolean(data);
  }

  const isLoggedIn = !!user;

  return (
    <div className="flex min-h-screen flex-col">
      <DesktopNav showDashboard={showDashboard} isLoggedIn={isLoggedIn} />
      <TopBar isArtist={showDashboard} />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <BottomNav isLoggedIn={isLoggedIn} />
    </div>
  );
}
