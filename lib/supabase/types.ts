export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_artist_summaries: {
        Row: {
          artist_id: string
          content: string
          expires_at: string
          generated_at: string | null
          id: string
          is_demo: boolean | null
          model: string
          prompt_hash: string
        }
        Insert: {
          artist_id: string
          content: string
          expires_at: string
          generated_at?: string | null
          id?: string
          is_demo?: boolean | null
          model: string
          prompt_hash: string
        }
        Update: {
          artist_id?: string
          content?: string
          expires_at?: string
          generated_at?: string | null
          id?: string
          is_demo?: boolean | null
          model?: string
          prompt_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_artist_summaries_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: true
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_locations: {
        Row: {
          artist_id: string
          created_at: string | null
          ends_at: string | null
          id: string
          is_current: boolean | null
          kind: string
          lat: number
          lng: number
          location_name: string
          notes: string | null
          starts_at: string | null
          studio_name: string | null
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_current?: boolean | null
          kind: string
          lat: number
          lng: number
          location_name: string
          notes?: string | null
          starts_at?: string | null
          studio_name?: string | null
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_current?: boolean | null
          kind?: string
          lat?: number
          lng?: number
          location_name?: string
          notes?: string | null
          starts_at?: string | null
          studio_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_locations_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_styles: {
        Row: {
          artist_id: string
          confidence: number | null
          is_manual: boolean | null
          style_id: string
        }
        Insert: {
          artist_id: string
          confidence?: number | null
          is_manual?: boolean | null
          style_id: string
        }
        Update: {
          artist_id?: string
          confidence?: number | null
          is_manual?: boolean | null
          style_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_styles_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_styles_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          bio: string | null
          claimed_by_user_id: string | null
          contact_email: string | null
          cover_image_url: string | null
          created_at: string | null
          display_name: string
          embedding_generated_at: string | null
          handle: string
          id: string
          instagram_access_token: string | null
          instagram_account_type: string | null
          instagram_handle: string | null
          instagram_token_encrypted: string | null
          instagram_token_expires_at: string | null
          instagram_user_id: string | null
          is_active: boolean | null
          is_claimed: boolean | null
          is_demo: boolean | null
          primary_styles: string[] | null
          profile_image_url: string | null
          style_description: string | null
          style_embedding: string | null
          updated_at: string | null
          verification_method: string | null
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          claimed_by_user_id?: string | null
          contact_email?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name: string
          embedding_generated_at?: string | null
          handle: string
          id?: string
          instagram_access_token?: string | null
          instagram_account_type?: string | null
          instagram_handle?: string | null
          instagram_token_encrypted?: string | null
          instagram_token_expires_at?: string | null
          instagram_user_id?: string | null
          is_active?: boolean | null
          is_claimed?: boolean | null
          is_demo?: boolean | null
          primary_styles?: string[] | null
          profile_image_url?: string | null
          style_description?: string | null
          style_embedding?: string | null
          updated_at?: string | null
          verification_method?: string | null
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          claimed_by_user_id?: string | null
          contact_email?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name?: string
          embedding_generated_at?: string | null
          handle?: string
          id?: string
          instagram_access_token?: string | null
          instagram_account_type?: string | null
          instagram_handle?: string | null
          instagram_token_encrypted?: string | null
          instagram_token_expires_at?: string | null
          instagram_user_id?: string | null
          is_active?: boolean | null
          is_claimed?: boolean | null
          is_demo?: boolean | null
          primary_styles?: string[] | null
          profile_image_url?: string | null
          style_description?: string | null
          style_embedding?: string | null
          updated_at?: string | null
          verification_method?: string | null
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      claims: {
        Row: {
          artist_id: string
          created_at: string | null
          email: string | null
          id: string
          instagram_handle: string
          instagram_user_id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          verification_code: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          instagram_handle: string
          instagram_user_id: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          verification_code?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          instagram_handle?: string
          instagram_user_id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claims_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          alt_text: string | null
          artist_id: string
          caption: string | null
          claude_description: string | null
          created_at: string | null
          detected_styles: string[] | null
          height: number | null
          id: string
          image_url: string
          instagram_media_id: string | null
          is_featured: boolean | null
          sort_order: number | null
          style_confidence: number | null
          style_embedding: string | null
          taken_at: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          artist_id: string
          caption?: string | null
          claude_description?: string | null
          created_at?: string | null
          detected_styles?: string[] | null
          height?: number | null
          id?: string
          image_url: string
          instagram_media_id?: string | null
          is_featured?: boolean | null
          sort_order?: number | null
          style_confidence?: number | null
          style_embedding?: string | null
          taken_at?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          artist_id?: string
          caption?: string | null
          claude_description?: string | null
          created_at?: string | null
          detected_styles?: string[] | null
          height?: number | null
          id?: string
          image_url?: string
          instagram_media_id?: string | null
          is_featured?: boolean | null
          sort_order?: number | null
          style_confidence?: number | null
          style_embedding?: string | null
          taken_at?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      query_embedding_cache: {
        Row: {
          created_at: string | null
          embedding: string
          hit_count: number | null
          last_used_at: string | null
          query_hash: string
          query_text: string
        }
        Insert: {
          created_at?: string | null
          embedding: string
          hit_count?: number | null
          last_used_at?: string | null
          query_hash: string
          query_text: string
        }
        Update: {
          created_at?: string | null
          embedding?: string
          hit_count?: number | null
          last_used_at?: string | null
          query_hash?: string
          query_text?: string
        }
        Relationships: []
      }
      saved_artists: {
        Row: {
          artist_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queries: {
        Row: {
          created_at: string | null
          id: string
          query_image_url: string | null
          query_text: string | null
          query_type: string
          result_count: number | null
          session_id: string | null
          top_artist_ids: string[] | null
          user_lat: number | null
          user_lng: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          query_image_url?: string | null
          query_text?: string | null
          query_type: string
          result_count?: number | null
          session_id?: string | null
          top_artist_ids?: string[] | null
          user_lat?: number | null
          user_lng?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          query_image_url?: string | null
          query_text?: string | null
          query_type?: string
          result_count?: number | null
          session_id?: string | null
          top_artist_ids?: string[] | null
          user_lat?: number | null
          user_lng?: number | null
        }
        Relationships: []
      }
      styles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_artists: {
        Args: {
          limit_count?: number
          max_distance_km?: number
          query_embedding: string
          style_weight?: number
          user_lat: number
          user_lng: number
        }
        Returns: {
          combined_score: number
          display_name: string
          distance_km: number
          handle: string
          id: string
          location_name: string
          primary_styles: string[]
          profile_image_url: string
          style_similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
