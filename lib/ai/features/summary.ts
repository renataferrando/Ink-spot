import crypto from "crypto";
import { anthropic, withRetry } from "@/lib/ai/claude";
import { ARTIST_SUMMARY_SYSTEM, buildArtistSummaryPrompt } from "@/lib/ai/prompts/artist-summary";

const MODEL = "claude-sonnet-4-6";
const TTL_DAYS = 7;

export type ArtistSummaryInput = {
  id: string;
  display_name: string;
  bio: string | null;
  primary_styles: string[];
  style_description: string | null;
  years_experience: number | null;
  is_demo: boolean;
  captions: string[];
};

export type ArtistSummaryResult = {
  artist_id: string;
  content: string;
  model: string;
  prompt_hash: string;
  is_demo: boolean;
  expires_at: string;
};

export async function generateArtistSummary(
  artist: ArtistSummaryInput,
): Promise<ArtistSummaryResult> {
  const userContent = buildArtistSummaryPrompt(artist);
  const promptHash = crypto
    .createHash("sha256")
    .update(ARTIST_SUMMARY_SYSTEM + userContent)
    .digest("hex");

  const message = await withRetry(() =>
    anthropic().messages.create({
      model: MODEL,
      max_tokens: 256,
      system: ARTIST_SUMMARY_SYSTEM,
      messages: [{ role: "user", content: userContent }],
    }),
  );

  const content =
    message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TTL_DAYS);

  return {
    artist_id: artist.id,
    content,
    model: MODEL,
    prompt_hash: promptHash,
    is_demo: artist.is_demo,
    expires_at: expiresAt.toISOString(),
  };
}
