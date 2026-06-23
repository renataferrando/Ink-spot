import type { MetadataRoute } from "next";

import { env } from "@/lib/validations/env";

// Only claimed non-demo artists are indexed.
// All seeded studios are is_demo=TRUE so the sitemap only contains
// static routes until real artists claim profiles (Phase 3+).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_APP_URL;

  return [
    { url: base, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${base}/explore`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];
}
