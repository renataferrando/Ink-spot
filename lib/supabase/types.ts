// Auto-generated shape — replace by running: npm run gen:types
// Once your Supabase project is live, regenerate with:
//   supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string;
          handle: string;
          display_name: string;
          bio: string | null;
          instagram_handle: string | null;
          instagram_user_id: string | null;
          instagram_access_token: string | null;
          instagram_token_expires_at: string | null;
          profile_image_url: string | null;
          cover_image_url: string | null;
          website_url: string | null;
          contact_email: string | null;
          years_experience: number | null;
          style_embedding: number[] | null;
          primary_styles: string[];
          style_description: string | null;
          is_demo: boolean;
          is_claimed: boolean;
          is_active: boolean;
          claimed_by_user_id: string | null;
          embedding_generated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          handle: string;
          display_name: string;
          bio?: string | null;
          instagram_handle?: string | null;
          instagram_user_id?: string | null;
          instagram_access_token?: string | null;
          instagram_token_expires_at?: string | null;
          profile_image_url?: string | null;
          cover_image_url?: string | null;
          website_url?: string | null;
          contact_email?: string | null;
          years_experience?: number | null;
          style_embedding?: number[] | null;
          primary_styles?: string[];
          style_description?: string | null;
          is_demo?: boolean;
          is_claimed?: boolean;
          is_active?: boolean;
          claimed_by_user_id?: string | null;
          embedding_generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          handle?: string;
          display_name?: string;
          bio?: string | null;
          instagram_handle?: string | null;
          instagram_user_id?: string | null;
          instagram_access_token?: string | null;
          instagram_token_expires_at?: string | null;
          profile_image_url?: string | null;
          cover_image_url?: string | null;
          website_url?: string | null;
          contact_email?: string | null;
          years_experience?: number | null;
          style_embedding?: number[] | null;
          primary_styles?: string[];
          style_description?: string | null;
          is_demo?: boolean;
          is_claimed?: boolean;
          is_active?: boolean;
          claimed_by_user_id?: string | null;
          embedding_generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      artist_locations: {
        Row: {
          id: string;
          artist_id: string;
          lat: number;
          lng: number;
          location_name: string;
          kind: "home_base" | "guest_spot" | "traveling";
          starts_at: string | null;
          ends_at: string | null;
          is_current: boolean;
          studio_name: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          artist_id: string;
          lat: number;
          lng: number;
          location_name: string;
          kind: "home_base" | "guest_spot" | "traveling";
          starts_at?: string | null;
          ends_at?: string | null;
          is_current?: boolean;
          studio_name?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          artist_id?: string;
          lat?: number;
          lng?: number;
          location_name?: string;
          kind?: "home_base" | "guest_spot" | "traveling";
          starts_at?: string | null;
          ends_at?: string | null;
          is_current?: boolean;
          studio_name?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      portfolio_items: {
        Row: {
          id: string;
          artist_id: string;
          image_url: string;
          instagram_media_id: string | null;
          caption: string | null;
          alt_text: string | null;
          style_embedding: number[] | null;
          detected_styles: string[];
          style_confidence: number | null;
          claude_description: string | null;
          width: number | null;
          height: number | null;
          taken_at: string | null;
          is_featured: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          artist_id: string;
          image_url: string;
          instagram_media_id?: string | null;
          caption?: string | null;
          alt_text?: string | null;
          style_embedding?: number[] | null;
          detected_styles?: string[];
          style_confidence?: number | null;
          claude_description?: string | null;
          width?: number | null;
          height?: number | null;
          taken_at?: string | null;
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          artist_id?: string;
          image_url?: string;
          instagram_media_id?: string | null;
          caption?: string | null;
          alt_text?: string | null;
          style_embedding?: number[] | null;
          detected_styles?: string[];
          style_confidence?: number | null;
          claude_description?: string | null;
          width?: number | null;
          height?: number | null;
          taken_at?: string | null;
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      styles: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: { id?: string; slug?: string; name?: string; description?: string | null; created_at?: string };
      };
      artist_styles: {
        Row: {
          artist_id: string;
          style_id: string;
          confidence: number;
          is_manual: boolean;
        };
        Insert: {
          artist_id: string;
          style_id: string;
          confidence?: number;
          is_manual?: boolean;
        };
        Update: { artist_id?: string; style_id?: string; confidence?: number; is_manual?: boolean };
      };
      claims: {
        Row: {
          id: string;
          artist_id: string;
          instagram_user_id: string;
          instagram_handle: string;
          email: string | null;
          status: "pending" | "approved" | "rejected";
          reviewed_at: string | null;
          reviewed_by: string | null;
          notes: string | null;
          verification_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          artist_id: string;
          instagram_user_id: string;
          instagram_handle: string;
          email?: string | null;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          notes?: string | null;
          verification_code?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          artist_id?: string;
          instagram_user_id?: string;
          instagram_handle?: string;
          email?: string | null;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          notes?: string | null;
          verification_code?: string | null;
          created_at?: string;
        };
      };
      search_queries: {
        Row: {
          id: string;
          query_text: string | null;
          query_image_url: string | null;
          query_type: string;
          user_lat: number | null;
          user_lng: number | null;
          result_count: number | null;
          top_artist_ids: string[] | null;
          session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          query_text?: string | null;
          query_image_url?: string | null;
          query_type: string;
          user_lat?: number | null;
          user_lng?: number | null;
          result_count?: number | null;
          top_artist_ids?: string[] | null;
          session_id?: string | null;
          created_at?: string;
        };
        Update: { id?: string; query_text?: string | null; query_image_url?: string | null; query_type?: string; user_lat?: number | null; user_lng?: number | null; result_count?: number | null; top_artist_ids?: string[] | null; session_id?: string | null; created_at?: string };
      };
      saved_artists: {
        Row: {
          user_id: string;
          artist_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          artist_id: string;
          created_at?: string;
        };
        Update: { user_id?: string; artist_id?: string; created_at?: string };
      };
      query_embedding_cache: {
        Row: {
          query_hash: string;
          query_text: string;
          embedding: number[];
          hit_count: number;
          created_at: string;
          last_used_at: string;
        };
        Insert: {
          query_hash: string;
          query_text: string;
          embedding: number[];
          hit_count?: number;
          created_at?: string;
          last_used_at?: string;
        };
        Update: { query_hash?: string; query_text?: string; embedding?: number[]; hit_count?: number; created_at?: string; last_used_at?: string };
      };
      ai_artist_summaries: {
        Row: {
          id: string;
          artist_id: string;
          content: string;
          model: string;
          prompt_hash: string;
          is_demo: boolean;
          generated_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          artist_id: string;
          content: string;
          model: string;
          prompt_hash: string;
          is_demo?: boolean;
          generated_at?: string;
          expires_at: string;
        };
        Update: { id?: string; artist_id?: string; content?: string; model?: string; prompt_hash?: string; is_demo?: boolean; generated_at?: string; expires_at?: string };
      };
    };
    Functions: {
      search_artists: {
        Args: {
          query_embedding: number[];
          user_lat: number;
          user_lng: number;
          max_distance_km?: number;
          style_weight?: number;
          limit_count?: number;
        };
        Returns: {
          id: string;
          handle: string;
          display_name: string;
          profile_image_url: string | null;
          location_name: string;
          primary_styles: string[];
          distance_km: number;
          style_similarity: number;
          combined_score: number;
        }[];
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
