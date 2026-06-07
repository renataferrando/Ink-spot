import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

function buildAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase service role is not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Typed client — use for SELECT queries where you want column type inference.
export function getSupabaseAdminClient() {
  return buildAdminClient();
}

// Untyped client — use for INSERT/UPDATE/DELETE in Server Actions where the
// hand-written types.ts causes 'never' inference until npm run gen:types is run.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseAdminClientUntyped(): ReturnType<typeof createClient<any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return buildAdminClient() as ReturnType<typeof createClient<any>>;
}
