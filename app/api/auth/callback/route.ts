import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/explore";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    // Returning artists skip onboarding and go straight to the dashboard.
    try {
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

        if (artist) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }
    } catch {
      // Admin client unavailable (e.g. missing service role key in env).
      // Fall through to the default next redirect — auth session is already set.
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "callback_error";
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
  }
}
