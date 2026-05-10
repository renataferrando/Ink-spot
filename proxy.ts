import { type NextRequest, NextResponse } from "next/server";

// Next 16: this file replaces middleware.ts (which is deprecated).
// The runtime is forced to Node.js and cannot be changed to Edge.
// Used to refresh Supabase session cookies on every navigation.

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured yet, pass through without modification.
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  const { createServerClient } = await import("@supabase/ssr");

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options ?? {}),
        );
      },
    },
  });

  // Refresh the session — do not remove this call.
  await supabase.auth.getUser();

  return supabaseResponse;
}
