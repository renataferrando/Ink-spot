import { anthropic } from "@/lib/ai/claude";
import {
  SEARCH_ASSISTANT_SYSTEM,
  buildSearchAssistantPrompt,
} from "@/lib/ai/prompts/search-assistant";

const MODEL = "claude-haiku-4-5-20251001";

export type SearchAssistantArtist = {
  display_name: string;
  primary_styles: string[];
  location_name: string | null;
  match_score: number;
};

export async function streamSearchAssistant(
  query: string,
  artists: SearchAssistantArtist[],
): Promise<ReadableStream<Uint8Array>> {
  const userContent = buildSearchAssistantPrompt(query, artists);

  const stream = await anthropic().messages.stream({
    model: MODEL,
    max_tokens: 256,
    system: SEARCH_ASSISTANT_SYSTEM,
    messages: [{ role: "user", content: userContent }],
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
