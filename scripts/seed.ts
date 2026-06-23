/**
 * Phase 2 seed: populate 20 fictional demo studios + artist_locations + portfolio_items.
 * Run: npm run seed
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Seed data ─────────────────────────────────────────────────────────────────

type StyleSlug =
  | "blackwork"
  | "fine-line"
  | "realism"
  | "watercolor"
  | "traditional"
  | "neo-traditional"
  | "geometric"
  | "minimalist"
  | "japanese"
  | "tribal"
  | "illustrative"
  | "dotwork";

interface SeedArtist {
  handle: string;
  display_name: string;
  bio: string;
  instagram_handle: string;
  primary_styles: StyleSlug[];
  style_description: string;
  years_experience: number;
  lat: number;
  lng: number;
  location_name: string;
  portfolio_count: number;
}

/** Verified town centers — pins jitter ±~300 m so studios don't stack. */
const CLUSTERS = {
  santaTeresa: { lat: 9.640056, lng: -85.162548, label: "Santa Teresa, Puntarenas" },
  malPais: { lat: 9.614536, lng: -85.143002, label: "Mal País, Puntarenas" },
} as const;

function coord(cluster: keyof typeof CLUSTERS, dLat: number, dLng: number) {
  const c = CLUSTERS[cluster];
  return {
    lat: +(c.lat + dLat).toFixed(6),
    lng: +(c.lng + dLng).toFixed(6),
    location_name: c.label,
  };
}

const STUDIOS: SeedArtist[] = [
  {
    handle: "luna-negra",
    display_name: "Luna Negra Studio",
    bio: "Demo studio specializing in blackwork and dotwork. Crisp linework, dark geometry, and fine stippling for timeless pieces.",
    instagram_handle: "luna_negra_demo",
    primary_styles: ["blackwork", "dotwork"],
    style_description: "Dark blackwork with geometric influences and meticulous dot stippling.",
    years_experience: 8,
    ...coord("santaTeresa", -0.002, -0.0015),
    portfolio_count: 8,
  },
  {
    handle: "marea-alta",
    display_name: "Marea Alta Tattoo",
    bio: "Demo studio for fine line and minimalist work. Delicate lines, tropical flora, and clean compositions.",
    instagram_handle: "marea_alta_demo",
    primary_styles: ["fine-line", "minimalist"],
    style_description: "Light fine line and botanical minimalism with Pacific coast influence.",
    years_experience: 5,
    ...coord("santaTeresa", -0.0035, -0.002),
    portfolio_count: 6,
  },
  {
    handle: "selva-digital",
    display_name: "Selva Digital",
    bio: "Demo studio for geometric and illustrative work. Math-driven patterns with rainforest-inspired motifs.",
    instagram_handle: "selva_digital_demo",
    primary_styles: ["geometric", "illustrative"],
    style_description: "Sacred geometry with narrative illustrations inspired by tropical fauna.",
    years_experience: 6,
    ...coord("santaTeresa", -0.005, -0.003),
    portfolio_count: 9,
  },
  {
    handle: "onda-sur",
    display_name: "Onda Sur Ink",
    bio: "Demo studio for traditional and neo-traditional work. Classic flash rethought with tropical color.",
    instagram_handle: "onda_sur_demo",
    primary_styles: ["traditional", "neo-traditional"],
    style_description: "American traditional flash with tropical color and a neo-traditional edge.",
    years_experience: 10,
    ...coord("santaTeresa", -0.0005, -0.001),
    portfolio_count: 10,
  },
  {
    handle: "coralito-studio",
    display_name: "Coralito Studio",
    bio: "Demo studio for watercolor and realism. Vivid color transitions and hyperrealistic marine fauna.",
    instagram_handle: "coralito_demo",
    primary_styles: ["watercolor", "realism"],
    style_description: "Vivid watercolors and hyperrealism from Costa Rica's South Pacific.",
    years_experience: 7,
    ...coord("santaTeresa", -0.0028, -0.0022),
    portfolio_count: 8,
  },
  {
    handle: "punta-verde-tattoo",
    display_name: "Punta Verde Tattoo",
    bio: "Demo studio focused on Japanese and traditional tattoos. Folklore-inspired imagery with bold linework.",
    instagram_handle: "punta_verde_demo",
    primary_styles: ["japanese", "traditional"],
    style_description:
      "Japanese folklore and botanical motifs with traditional American influence.",
    years_experience: 9,
    ...coord("santaTeresa", -0.006, -0.004),
    portfolio_count: 7,
  },
  {
    handle: "arte-pacifico",
    display_name: "Arte Pacífico Demo",
    bio: "Demo studio for blackwork and geometric work. Architectural precision meets dark ink.",
    instagram_handle: "arte_pacifico_demo",
    primary_styles: ["blackwork", "geometric"],
    style_description: "Architectural blackwork with precise geometric construction.",
    years_experience: 4,
    ...coord("santaTeresa", 0.0002, 0.0005),
    portfolio_count: 6,
  },
  {
    handle: "playa-oscura-ink",
    display_name: "Playa Oscura Ink",
    bio: "Demo studio for fine line and realism. Portrait work and delicate botanical compositions.",
    instagram_handle: "playa_oscura_demo",
    primary_styles: ["fine-line", "realism"],
    style_description: "Fine line portraiture and photorealistic botanical work.",
    years_experience: 6,
    ...coord("santaTeresa", -0.004, -0.0035),
    portfolio_count: 8,
  },
  {
    handle: "tortuga-arte",
    display_name: "Tortuga Arte Studio",
    bio: "Demo studio for tribal and illustrative work. Pacific Islander and Pre-Columbian-inspired motifs.",
    instagram_handle: "tortuga_arte_demo",
    primary_styles: ["tribal", "illustrative"],
    style_description: "Pacific Islander tribal patterns and Pre-Columbian illustrative motifs.",
    years_experience: 11,
    ...coord("malPais", 0.002, -0.001),
    portfolio_count: 7,
  },
  {
    handle: "sol-de-tinta",
    display_name: "Sol de Tinta",
    bio: "Demo studio specializing in watercolor and minimalist tattoos. Abstract color washes and delicate forms.",
    instagram_handle: "sol_de_tinta_demo",
    primary_styles: ["watercolor", "minimalist"],
    style_description: "Abstract watercolor washes combined with minimalist linework.",
    years_experience: 5,
    ...coord("santaTeresa", 0.001, -0.0008),
    portfolio_count: 6,
  },
  {
    handle: "demo-norte-ink",
    display_name: "Demo Norte Ink",
    bio: "Demo studio for dotwork and blackwork. Stippling precision and dark compositions.",
    instagram_handle: "demo_norte_ink",
    primary_styles: ["dotwork", "blackwork"],
    style_description: "Meticulous stipple work and heavy blackwork compositions.",
    years_experience: 7,
    ...coord("santaTeresa", 0.0018, -0.0012),
    portfolio_count: 7,
  },
  {
    handle: "estudio-tico-arte",
    display_name: "Estudio Tico Arte",
    bio: "Demo studio for traditional and neo-traditional work rooted in Costa Rican imagery.",
    instagram_handle: "estudio_tico_demo",
    primary_styles: ["traditional", "neo-traditional"],
    style_description: "Costa Rican-themed traditional tattoos with neo-traditional colour depth.",
    years_experience: 8,
    ...coord("malPais", -0.001, 0.0015),
    portfolio_count: 9,
  },
  {
    handle: "demo-sur-tattoo",
    display_name: "Demo Sur Tattoo",
    bio: "Demo studio for geometric and Japanese-influenced work. Pattern-driven precision.",
    instagram_handle: "demo_sur_tattoo",
    primary_styles: ["geometric", "japanese"],
    style_description: "Japanese-inspired geometric compositions with decorative fill.",
    years_experience: 5,
    ...coord("santaTeresa", -0.003, -0.0045),
    portfolio_count: 6,
  },
  {
    handle: "arte-costero-studio",
    display_name: "Arte Costero Studio",
    bio: "Demo studio for fine line and minimalist coastal tattoos. Clean, precise, and refined.",
    instagram_handle: "arte_costero_demo",
    primary_styles: ["fine-line", "minimalist"],
    style_description: "Coastal minimalist linework — waves, flora, fauna rendered with precision.",
    years_experience: 4,
    ...coord("santaTeresa", 0.0035, 0.001),
    portfolio_count: 6,
  },
  {
    handle: "demo-centro-arte",
    display_name: "Demo Centro Arte",
    bio: "Demo studio for realism and illustrative work. Painterly portraits and detailed scenes.",
    instagram_handle: "demo_centro_arte",
    primary_styles: ["realism", "illustrative"],
    style_description: "Painterly realism with illustrative narrative elements.",
    years_experience: 9,
    ...coord("malPais", 0.003, -0.002),
    portfolio_count: 8,
  },
  {
    handle: "guanacaste-arte-demo",
    display_name: "Guanacaste Arte Demo",
    bio: "Demo studio for blackwork and dotwork inspired by dry forest patterns.",
    instagram_handle: "guanacaste_arte_demo",
    primary_styles: ["blackwork", "dotwork"],
    style_description: "Dry forest flora rendered in heavy blackwork and stipple.",
    years_experience: 6,
    ...coord("santaTeresa", -0.0015, 0.002),
    portfolio_count: 7,
  },
  {
    handle: "nicoya-ink-demo",
    display_name: "Nicoya Ink Demo",
    bio: "Demo studio for fine line and realism with Peninsula heritage motifs.",
    instagram_handle: "nicoya_ink_demo",
    primary_styles: ["fine-line", "realism"],
    style_description: "Nicoya Peninsula cultural motifs in fine line and photorealism.",
    years_experience: 5,
    ...coord("malPais", -0.0025, -0.003),
    portfolio_count: 6,
  },
  {
    handle: "estudio-tico-demo",
    display_name: "Estudio Tico Demo",
    bio: "Demo studio for traditional and illustrative work celebrating tropical biodiversity.",
    instagram_handle: "estudio_tico_demo2",
    primary_styles: ["traditional", "illustrative"],
    style_description: "Costa Rican biodiversity rendered in traditional and illustrative styles.",
    years_experience: 7,
    ...coord("santaTeresa", 0.004, -0.0025),
    portfolio_count: 8,
  },
  {
    handle: "demo-pacifico-sur",
    display_name: "Demo Pacífico Sur",
    bio: "Demo studio for watercolor and geometric. Tropical colour palette, precise geometry.",
    instagram_handle: "demo_pacifico_sur",
    primary_styles: ["watercolor", "geometric"],
    style_description: "Tropical watercolour palette constrained by geometric scaffolding.",
    years_experience: 4,
    ...coord("malPais", 0.001, 0.002),
    portfolio_count: 6,
  },
  {
    handle: "arte-tropical-demo",
    display_name: "Arte Tropical Demo",
    bio: "Demo studio for blackwork and geometric with a tropical-dark aesthetic.",
    instagram_handle: "arte_tropical_demo",
    primary_styles: ["blackwork", "geometric"],
    style_description: "Tropical flora deconstructed into heavy black geometry.",
    years_experience: 5,
    ...coord("santaTeresa", -0.0055, 0.0005),
    portfolio_count: 6,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Real tattoo photos from Unsplash, grouped by style. Used to give demo
 *  portfolios a believable look until real artist uploads replace them. */
const STYLE_IMAGES: Record<StyleSlug, string[]> = {
  blackwork: [
    "https://images.unsplash.com/photo-1619727968062-573533bfc967",
    "https://images.unsplash.com/photo-1604374376934-2df6fad6519b",
    "https://images.unsplash.com/photo-1543244128-30d70d41e2a9",
    "https://images.unsplash.com/photo-1568735264348-2e141c082d37",
    "https://images.unsplash.com/photo-1607382007937-fe3a9d196b7a",
    "https://images.unsplash.com/photo-1566745508112-1897e540b262",
  ],
  "fine-line": [
    "https://images.unsplash.com/photo-1628969454009-843d2369e964",
    "https://images.unsplash.com/photo-1588747020191-64c5bc8a4fd5",
    "https://images.unsplash.com/photo-1542727365-19732a80dcfd",
    "https://images.unsplash.com/photo-1566360897115-7c6bf96cea01",
    "https://images.unsplash.com/photo-1659615043416-c492e7f4f8ab",
    "https://images.unsplash.com/photo-1607382007937-fe3a9d196b7a",
  ],
  realism: [
    "https://images.unsplash.com/photo-1623850575867-06e8682dfc88",
    "https://images.unsplash.com/photo-1613505879804-bc32efd1e76d",
  ],
  watercolor: ["https://images.unsplash.com/photo-1752303166259-c15544181efd"],
  traditional: [
    "https://images.unsplash.com/photo-1585665883724-c00f3d658207",
    "https://images.unsplash.com/photo-1479767574301-a01c78234a0c",
    "https://images.unsplash.com/photo-1623850575867-06e8682dfc88",
  ],
  "neo-traditional": [
    "https://images.unsplash.com/photo-1479767574301-a01c78234a0c",
    "https://images.unsplash.com/photo-1665085326630-b01fea9a613d",
    "https://images.unsplash.com/photo-1623850575867-06e8682dfc88",
    "https://images.unsplash.com/photo-1613505879804-bc32efd1e76d",
    "https://images.unsplash.com/photo-1610101458810-ee4d92868976",
  ],
  geometric: [
    "https://images.unsplash.com/photo-1568735264348-2e141c082d37",
    "https://images.unsplash.com/photo-1613505879804-bc32efd1e76d",
  ],
  minimalist: [
    "https://images.unsplash.com/photo-1588747020191-64c5bc8a4fd5",
    "https://images.unsplash.com/photo-1542727365-19732a80dcfd",
    "https://images.unsplash.com/photo-1659615043416-c492e7f4f8ab",
    "https://images.unsplash.com/photo-1752303166259-c15544181efd",
  ],
  japanese: [
    "https://images.unsplash.com/photo-1585665883724-c00f3d658207",
    "https://images.unsplash.com/photo-1665085326630-b01fea9a613d",
    "https://images.unsplash.com/photo-1610101458810-ee4d92868976",
  ],
  tribal: [
    "https://images.unsplash.com/photo-1619727968062-573533bfc967",
    "https://images.unsplash.com/photo-1568735264348-2e141c082d37",
  ],
  illustrative: [
    "https://images.unsplash.com/photo-1628969454009-843d2369e964",
    "https://images.unsplash.com/photo-1604374376934-2df6fad6519b",
    "https://images.unsplash.com/photo-1543244128-30d70d41e2a9",
    "https://images.unsplash.com/photo-1665085326630-b01fea9a613d",
    "https://images.unsplash.com/photo-1607382007937-fe3a9d196b7a",
    "https://images.unsplash.com/photo-1566745508112-1897e540b262",
    "https://images.unsplash.com/photo-1610101458810-ee4d92868976",
  ],
  dotwork: [
    "https://images.unsplash.com/photo-1566360897115-7c6bf96cea01",
    "https://images.unsplash.com/photo-1566745508112-1897e540b262",
  ],
};

function portfolioSeed(handle: string, n: number, styles: StyleSlug[]) {
  const pool = Array.from(new Set(styles.flatMap((style) => STYLE_IMAGES[style])));
  return Array.from({ length: n }, (_, i) => ({
    image_url: `${pool[i % pool.length]}?auto=format&fit=crop&w=800&h=800&q=80`,
    alt_text: `Portfolio piece ${i + 1} from ${handle}`,
    is_featured: i === 0,
    sort_order: i,
    detected_styles: [] as string[],
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🗑  Clearing existing demo data…");

  // Delete in dependency order
  const { error: piErr } = await supabase
    .from("portfolio_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all
  if (piErr) console.warn("portfolio_items:", piErr.message);

  const { error: alErr } = await supabase
    .from("artist_locations")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (alErr) console.warn("artist_locations:", alErr.message);

  const { error: asErr } = await supabase
    .from("artist_styles")
    .delete()
    .neq("artist_id", "00000000-0000-0000-0000-000000000000");
  if (asErr) console.warn("artist_styles:", asErr.message);

  const { error: aErr } = await supabase.from("artists").delete().eq("is_demo", true);
  if (aErr) console.warn("artists:", aErr.message);

  console.log("🌱 Seeding 20 demo studios…");

  for (const studio of STUDIOS) {
    // 1. Insert artist
    const { data: artist, error: artistErr } = await supabase
      .from("artists")
      .insert({
        handle: studio.handle,
        display_name: studio.display_name,
        bio: studio.bio,
        instagram_handle: studio.instagram_handle,
        primary_styles: studio.primary_styles,
        style_description: studio.style_description,
        years_experience: studio.years_experience,
        profile_image_url: `https://picsum.photos/seed/${studio.handle}/400/400`,
        cover_image_url: `https://picsum.photos/seed/${studio.handle}-cover/1200/400`,
        is_demo: true,
        is_claimed: false,
        is_active: true,
      })
      .select("id")
      .single();

    if (artistErr || !artist) {
      console.error(`✗ ${studio.display_name}:`, artistErr?.message);
      continue;
    }

    // 2. Insert home_base location
    const { error: locErr } = await supabase.from("artist_locations").insert({
      artist_id: artist.id,
      lat: studio.lat,
      lng: studio.lng,
      location_name: studio.location_name,
      kind: "home_base",
      is_current: true,
    });
    if (locErr) console.warn(`  location for ${studio.handle}:`, locErr.message);

    // 3. Insert portfolio items
    const items = portfolioSeed(studio.handle, studio.portfolio_count, studio.primary_styles).map(
      (item) => ({
        ...item,
        artist_id: artist.id,
      })
    );
    const { error: itemsErr } = await supabase.from("portfolio_items").insert(items);
    if (itemsErr) console.warn(`  portfolio for ${studio.handle}:`, itemsErr.message);

    console.log(`  ✓ ${studio.display_name} (${studio.portfolio_count} portfolio items)`);
  }

  console.log("\n✅ Seed complete. 20 studios, 20 home_base locations, ~155 portfolio items.");
  console.log("   Next: npm run build  →  then open /explore to verify.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
