import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

// Cookie-free anon client for public reads (e.g. artist profile content).
// Unlike getSupabaseServerClient, this never touches cookies(), so it's safe
// to call from statically rendered / ISR-cached routes (generateStaticParams,
// generateMetadata, revalidate) without forcing them into dynamic rendering.
export function getSupabasePublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createClient<Database>(url, key);
}
