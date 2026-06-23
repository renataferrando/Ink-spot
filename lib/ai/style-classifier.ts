import { ALL_STYLES, type ArtistStyle } from "@/types/artist";

import { anthropic, withRetry } from "./claude";
import { STYLE_CLASSIFICATION_PROMPT } from "./prompts";

export interface StyleClassification {
  styles: ArtistStyle[];
  confidence: number;
  description: string;
}

// Claude Haiku is vision-capable and priced at ~$0.80/MTok input, $4/MTok output.
// A typical tattoo image costs ~$0.001–$0.002 in tokens (well under $0.01).
const MODEL = "claude-haiku-4-5-20251001";

// Haiku token pricing (USD per token)
const INPUT_COST_PER_TOKEN = 0.8 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 4 / 1_000_000;

export async function classifyStyle(imageUrl: string): Promise<StyleClassification> {
  const response = await withRetry(() =>
    anthropic().messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: STYLE_CLASSIFICATION_PROMPT,
            },
          ],
        },
      ],
    }),
  );

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const estimatedCost = inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN;
  console.log(
    `[style-classifier] tokens: ${inputTokens} in / ${outputTokens} out — est. cost: $${estimatedCost.toFixed(5)}`,
  );

  const raw = response.content[0];
  if (raw.type !== "text") throw new Error("Unexpected response type from Claude");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.text);
  } catch {
    throw new Error(`style-classifier: invalid JSON from model: ${raw.text.slice(0, 200)}`);
  }

  return validate(parsed);
}

function validate(raw: unknown): StyleClassification {
  if (typeof raw !== "object" || raw === null) throw new Error("style-classifier: not an object");

  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.styles)) throw new Error("style-classifier: styles not array");
  const styles = obj.styles.filter((s): s is ArtistStyle =>
    ALL_STYLES.includes(s as ArtistStyle),
  );
  if (styles.length === 0) throw new Error("style-classifier: no valid catalog styles returned");

  const confidence =
    typeof obj.confidence === "number" ? Math.min(1, Math.max(0, obj.confidence)) : 0.5;

  const description = typeof obj.description === "string" ? obj.description : "";

  return { styles, confidence, description };
}
