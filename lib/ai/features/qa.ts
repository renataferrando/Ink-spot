import { anthropic } from "@/lib/ai/claude";
import { ARTIST_QA_SYSTEM, buildArtistQAContext } from "@/lib/ai/prompts/artist-qa";

const MODEL = "claude-haiku-4-5-20251001";

export type QAMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ArtistQAInput = {
  display_name: string;
  bio: string | null;
  primary_styles: string[];
  style_description: string | null;
  years_experience: number | null;
  website_url: string | null;
  current_location: string | null;
  upcoming_locations: string[];
  portfolio_captions: string[];
};

export async function streamArtistQA(
  artist: ArtistQAInput,
  history: QAMessage[],
  question: string,
): Promise<ReadableStream<Uint8Array>> {
  const context = buildArtistQAContext(artist);
  const systemWithContext = `${ARTIST_QA_SYSTEM}\n\n---\n${context}`;

  const messages = [
    ...history.slice(-10),
    { role: "user" as const, content: question },
  ];

  const stream = await anthropic().messages.stream({
    model: MODEL,
    max_tokens: 512,
    system: systemWithContext,
    messages,
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          const data = `data: ${JSON.stringify({ type: "token", text: event.delta.text })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });
}
