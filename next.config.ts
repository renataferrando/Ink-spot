import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

import "./lib/validations/env";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
        pathname: "/**",
      },
      // Phase 1 demo images — replaced by Supabase Storage in Phase 2
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      // Demo portfolio images (scripts/seed.ts) — replaced by Supabase Storage in Phase 2
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
