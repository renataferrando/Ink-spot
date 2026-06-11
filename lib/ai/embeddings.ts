import { env } from "@/lib/validations/env";

const VOYAGE_MULTIMODAL_API_URL = "https://api.voyageai.com/v1/multimodalembeddings";
const MODEL = "voyage-multimodal-3";
const DIMENSIONS = 1024;

function getApiKey(): string {
  const key = env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY is not set");
  return key;
}

export interface EmbeddingResult {
  embedding: number[];
  totalTokens: number;
}

// ── Text embedding ─────────────────────────────────────────────────────────────
// Embeds a plain text string. Used for search query text and for artist text
// descriptions when no portfolio images are available.
export async function embedText(text: string): Promise<EmbeddingResult> {
  const apiKey = getApiKey();
  const res = await fetch(VOYAGE_MULTIMODAL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      inputs: [{ content: [{ type: "text", text }] }],
      input_type: "document",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage embedText failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    data: { embedding: number[] }[];
    usage: { total_tokens: number };
  };

  return {
    embedding: json.data[0].embedding,
    totalTokens: json.usage.total_tokens,
  };
}

// ── Multimodal embedding (text + images) ─────────────────────────────────────
// Embeds a combination of text and image URLs using voyage-multimodal-3.
// Pass the artist's combined style description as `text` and up to 10 portfolio
// image URLs as `imageUrls`. Falls back to text-only when imageUrls is empty.
export async function embedArtist(text: string, imageUrls: string[]): Promise<EmbeddingResult> {
  if (imageUrls.length === 0) {
    return embedText(text);
  }

  const apiKey = getApiKey();

  // Voyage requires base64-encoded images — fetch and convert each URL.
  const imageItems = (
    await Promise.all(
      imageUrls.slice(0, 10).map(async (url) => {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
          if (!res.ok) return null;
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          return { type: "image_base64" as const, image_base64: base64 };
        } catch {
          return null;
        }
      }),
    )
  ).filter((item): item is { type: "image_base64"; image_base64: string } => item !== null);

  // If all image fetches failed, fall back to text-only
  if (imageItems.length === 0) {
    return embedText(text);
  }

  const content = [{ type: "text" as const, text }, ...imageItems];

  try {
    const res = await fetch(VOYAGE_MULTIMODAL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        inputs: [{ content }],
        input_type: "document",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Voyage embedArtist failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      data: { embedding: number[] }[];
      usage: { total_tokens: number };
    };

    return {
      embedding: json.data[0].embedding,
      totalTokens: json.usage.total_tokens,
    };
  } catch {
    // Fall back to text-only if multimodal call fails (e.g. unsupported image format)
    return embedText(text);
  }
}

// ── Search query embedding ────────────────────────────────────────────────────
// Embeds a search query string. Uses `input_type: "query"` so the model
// optimises the vector for retrieval rather than document representation.
export async function embedQuery(text: string): Promise<EmbeddingResult> {
  const apiKey = getApiKey();

  // voyage-multimodal-3 only exists on the multimodal endpoint — use text-only content
  const res = await fetch(VOYAGE_MULTIMODAL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      inputs: [{ content: [{ type: "text", text }] }],
      input_type: "query",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage embedQuery failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    data: { embedding: number[] }[];
    usage: { total_tokens: number };
  };

  return {
    embedding: json.data[0].embedding,
    totalTokens: json.usage.total_tokens,
  };
}

export { DIMENSIONS };
