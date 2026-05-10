import { z } from "zod";

/**
 * Environment variable schema validated on startup.
 *
 * `clientSchema` is enforced in both server and browser bundles (only
 * `NEXT_PUBLIC_*` variables are inlined client-side by Next.js).
 * `serverSchema` is enforced only on the server, where the full process.env is
 * available.
 *
 * Variables that are only needed in later phases (Supabase, Anthropic, Voyage,
 * Instagram, Google Geocoding, cron) are marked optional so a Phase 1 build
 * does not fail when their values are not yet provisioned. They become
 * required functionally inside the modules that consume them.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .refine((value) => !value.endsWith("/"), {
      message: "NEXT_PUBLIC_APP_URL must not end with a trailing slash",
    }),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "preview", "production"]),
  NEXT_PUBLIC_MAP_TILES_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  VOYAGE_API_KEY: z.string().min(1).optional(),
  OPENCAGE_API_KEY: z.string().min(1).optional(),
  ADMIN_USER_ID: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    z.string().uuid().optional(),
  ),
  CRON_SECRET: z.string().min(32).optional(),
});

const clientRuntimeEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_MAP_TILES_URL: process.env.NEXT_PUBLIC_MAP_TILES_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const isServer = typeof window === "undefined";

function formatIssues(label: string, error: z.ZodError): string {
  const lines = error.issues.map((issue) => {
    const path = issue.path.join(".") || "(root)";
    return `  - ${path}: ${issue.message}`;
  });
  return `❌ Invalid ${label} environment variables:\n${lines.join("\n")}`;
}

const clientResult = clientSchema.safeParse(clientRuntimeEnv);
if (!clientResult.success) {
  throw new Error(formatIssues("public", clientResult.error));
}

const serverResult = isServer
  ? serverSchema.safeParse(process.env)
  : ({ success: true, data: {} as z.infer<typeof serverSchema> } as const);

if (!serverResult.success) {
  throw new Error(formatIssues("server", serverResult.error));
}

export const env = {
  ...clientResult.data,
  ...serverResult.data,
} as z.infer<typeof clientSchema> & Partial<z.infer<typeof serverSchema>>;

export type Env = typeof env;
