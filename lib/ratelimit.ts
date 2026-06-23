import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Returns null when Upstash env vars are not configured (development / CI).
// Routes check for null and skip rate limiting in that case.
function buildRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "rate limiting disabled in production: UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN are not set",
      );
    }
    return null;
  }
  return new Redis({ url, token });
}

const redis = buildRedis();

function slidingWindow(redis: Redis, requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
  });
}

// One limiter instance per policy — lazy, singleton per cold start.
const limiters: Record<string, Ratelimit> = {};

function getLimiter(key: string, requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`): Ratelimit | null {
  if (!redis) return null;
  if (!limiters[key]) limiters[key] = slidingWindow(redis, requests, window);
  return limiters[key];
}

export type RateLimitPolicy =
  | "search"          // 10 req/min
  | "search-assistant" // 5 req/min
  | "artist-qa";      // 10 req/min

const POLICIES: Record<RateLimitPolicy, { requests: number; window: `${number} ${"s" | "m" | "h" | "d"}` }> = {
  "search":           { requests: 10, window: "1 m" },
  "search-assistant": { requests: 5,  window: "1 m" },
  "artist-qa":        { requests: 10, window: "1 m" },
};

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Returns a 429 Response if the client is over limit, null otherwise.
 * When Upstash is not configured, always returns null (no-op in dev).
 */
export async function rateLimit(
  policy: RateLimitPolicy,
  identifier: string,
): Promise<Response | null> {
  const { requests, window } = POLICIES[policy];
  const limiter = getLimiter(policy, requests, window);
  if (!limiter) return null;

  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return new Response("Too many requests", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
        "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
      },
    });
  }

  return null;
}
