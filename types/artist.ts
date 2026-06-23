export type ArtistStyle =
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

export const STYLE_LABELS: Record<ArtistStyle, string> = {
  blackwork: "Blackwork",
  "fine-line": "Fine Line",
  realism: "Realism",
  watercolor: "Watercolor",
  traditional: "Traditional",
  "neo-traditional": "Neo Traditional",
  geometric: "Geometric",
  minimalist: "Minimalist",
  japanese: "Japanese",
  tribal: "Tribal",
  illustrative: "Illustrative",
  dotwork: "Dotwork",
};

export const ALL_STYLES = Object.keys(STYLE_LABELS) as ArtistStyle[];

export interface ArtistLocation {
  id: string;
  artist_id: string;
  lat: number;
  lng: number;
  location_name: string;
  kind: "home_base" | "guest_spot" | "traveling";
  starts_at?: string | null;
  ends_at?: string | null;
  is_current: boolean;
  studio_name?: string | null;
  notes?: string | null;
}

export interface PortfolioItem {
  id: string;
  artist_id: string;
  image_url: string;
  caption?: string | null;
  alt_text?: string | null;
  detected_styles: ArtistStyle[];
  is_featured: boolean;
  sort_order: number;
  width?: number | null;
  height?: number | null;
}

export interface Artist {
  id: string;
  handle: string;
  display_name: string;
  bio?: string | null;
  /** Current location joined from artist_locations WHERE is_current = TRUE */
  current_location?: ArtistLocation | null;
  /** Upcoming guest_spot / traveling entries (future start_at) */
  upcoming_locations?: ArtistLocation[];
  /** Chronological next stop (may be home base between trips). */
  next_location?: Pick<ArtistLocation, "location_name" | "kind" | "starts_at" | "ends_at" | "studio_name"> | null;
  instagram_handle?: string | null;
  profile_image_url?: string | null;
  cover_image_url?: string | null;
  website_url?: string | null;
  contact_email?: string | null;
  years_experience?: number | null;
  primary_styles: ArtistStyle[];
  style_description?: string | null;
  is_demo: boolean;
  is_claimed: boolean;
  is_active: boolean;
  portfolio_items: PortfolioItem[];
  created_at: string;
  updated_at: string;
}

export type ArtistPublic = Artist;

export interface ArtistWithScore extends ArtistPublic {
  distance_km?: number;
  style_similarity?: number;
  combined_score: number;
}
