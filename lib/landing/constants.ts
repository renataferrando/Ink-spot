export const E_OUT: [number, number, number, number] = [0.2, 0.7, 0.2, 1];

const PORTFOLIO_IMGS: Record<string, string> = {
  "luna-1": "https://res.cloudinary.com/dtvkdwnoa/image/upload/v1781810692/2152021013_tpk8zo.jpg",
  "kai-1": "https://res.cloudinary.com/dtvkdwnoa/image/upload/v1781810732/19581_fybroo.jpg",
  "kai-2": "https://images.unsplash.com/photo-1590403823825-8dbc090b8e95",
  "tomas-1": "https://res.cloudinary.com/dtvkdwnoa/image/upload/v1781810782/2149525984_kcr3mv.jpg",
  "mari-2": "https://images.unsplash.com/photo-1548690596-f1b6d71b9ba7",
  "luna-avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  "kai-avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  "tomas-avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
};

const img = (seed: string, w = 600, h = 600) => {
  const base = PORTFOLIO_IMGS[seed];
  return base
    ? `${base}?auto=format&fit=crop&w=${w}&h=${h}&q=80`
    : `https://picsum.photos/seed/inkspot-${seed}/${w}/${h}`;
};

export const ARTISTS_MOCK = [
  {
    name: "Luna Vargas",
    avatar: img("luna-avatar", 200, 200),
    portfolio0: img("luna-1", 600, 800),
    styles: "Fine Line · Minimalist",
  },
  {
    name: "Kai Mendoza",
    avatar: img("kai-avatar", 200, 200),
    portfolio0: img("kai-1", 600, 800),
    styles: "Blackwork · Geometric",
  },
  {
    name: "Tomas Reyes",
    avatar: img("tomas-avatar", 200, 200),
    portfolio0: img("tomas-1", 600, 800),
    styles: "Dotwork · Geometric",
  },
];

export const SHOWCASE_CARDS = [
  { artist: ARTISTS_MOCK[0], pct: 96, style: "Fine Line" },
  { artist: ARTISTS_MOCK[1], pct: 91, style: "Blackwork" },
  { artist: ARTISTS_MOCK[2], pct: 84, style: "Dotwork" },
];

export const FLOATS = [
  {
    src: "/landing/float-fine-line.png",
    speed: 80,
    delay: 0.45,
    bob: 0,
    w: 172,
    h: 228,
    top: "calc(6% + 58vh)",
    right: "calc(7% + 25vw)",
    rotate: 10,
  },
  {
    src: "/landing/float-blackwork.png",
    speed: 152,
    delay: 0.6,
    bob: -2,
    w: 144,
    h: 190,
    top: "calc(20% + 48vh)",
    right: "calc(31% - 14vw)",
    rotate: -8,
  },
  {
    src: "/landing/float-dotwork.png",
    speed: 224,
    delay: 0.75,
    bob: -4,
    w: 168,
    h: 222,
    bottom: "calc(7% + 53vh)",
    right: "calc(10% + 4vw)",
    rotate: 12,
  },
  {
    src: "/landing/float-realism.png",
    speed: 296,
    delay: 0.9,
    bob: -6,
    w: 138,
    h: 182,
    bottom: "calc(9% + 44vh)",
    right: "calc(33% - 10vw)",
    rotate: -7,
  },
] as const;

export const ROTOR_WORDS = ["blackwork", "fine line", "dotwork", "realism", "watercolor"];

export const MARQUEE = [
  "Blackwork",
  "Fine Line",
  "Dotwork",
  "Realism",
  "Watercolor",
  "Geometric",
  "Japanese",
  "Sacred",
  "Minimalist",
  "Traditional",
];

export const HOW_STEPS = [
  {
    k: "Search",
    h: "Describe it. Snap it. Say it.",
    p: "Type a vibe, drop a reference photo, or use your voice. InkSpot reads the style of the work itself — not just hashtags.",
  },
  {
    k: "Match",
    h: "Style meets proximity.",
    p: "Every artist is ranked 60% on how closely their work matches yours and 40% on how near they are right now. The best fit rises to the top.",
  },
  {
    k: "Book",
    h: "Catch them while they're in town.",
    p: "Artists are nomadic. See who's near you today and who leaves Friday, then reach out before the chair fills up.",
  },
];
