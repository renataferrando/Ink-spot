import Anthropic, {
  InternalServerError,
  RateLimitError,
} from "@anthropic-ai/sdk";

import { env } from "@/lib/validations/env";

function getClient(): Anthropic {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey, maxRetries: 0 });
}

// Lazy singleton — one instance per serverless invocation.
let _client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!_client) _client = getClient();
  return _client;
}

// ── Simple in-process token-bucket rate limiter ──────────────────────────────
// Limits concurrent/sustained throughput within a single process. Not
// distributed — acceptable for Stage 4.1 single-server usage.
class TokenBucket {
  private tokens: number;
  private lastRefill = Date.now();

  constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number,
  ) {
    this.tokens = capacity;
  }

  async consume(count = 1): Promise<void> {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSecond);
    this.lastRefill = now;

    if (this.tokens >= count) {
      this.tokens -= count;
      return;
    }

    const waitMs = ((count - this.tokens) / this.refillPerSecond) * 1000;
    await sleep(waitMs);
    this.tokens = 0;
    this.lastRefill = Date.now();
  }
}

// 5 requests per second, burst up to 10.
const bucket = new TokenBucket(10, 5);

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ── Exponential retry wrapper ─────────────────────────────────────────────────
// Retries on 429 (RateLimitError) and 5xx (InternalServerError) only.
export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await bucket.consume();
      return await fn();
    } catch (err) {
      const retryable = err instanceof RateLimitError || err instanceof InternalServerError;
      if (!retryable || attempt === maxAttempts - 1) throw err;
      const jitter = Math.random() * 500;
      const delay = Math.min(1000 * 2 ** attempt + jitter, 30_000);
      await sleep(delay);
    }
  }
  // unreachable — satisfies TypeScript
  throw new Error("withRetry: exhausted attempts");
}
