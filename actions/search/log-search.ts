"use server";

import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";

export interface LogSearchParams {
  queryText?: string;
  queryImageUrl?: string;
  queryType: "text" | "image" | "voice" | "combined";
  userLat?: number;
  userLng?: number;
  resultCount: number;
  topArtistIds: string[];
  sessionId?: string;
}

// Fire-and-forget analytics. Never throws — failures are silently ignored.
export async function logSearch(params: LogSearchParams): Promise<void> {
  try {
    const admin = getSupabaseAdminClientUntyped();
    await admin.from("search_queries").insert({
      query_text: params.queryText ?? null,
      query_image_url: params.queryImageUrl ?? null,
      query_type: params.queryType,
      user_lat: params.userLat ?? null,
      user_lng: params.userLng ?? null,
      result_count: params.resultCount,
      top_artist_ids: params.topArtistIds.slice(0, 5),
      session_id: params.sessionId ?? null,
    });
  } catch {
    // Analytics failure must never surface to the user
  }
}
