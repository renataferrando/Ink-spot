# ADR 001 — Next.js Monorepo (No Separate Backend)

**Status:** Accepted  
**Date:** 2025-01-01

## Context

InkSpot needs an API layer for artist data, search, Instagram OAuth, and AI features. The question is whether to build a separate backend service (Node.js API, FastAPI, etc.) or colocate it in the Next.js project.

## Decision

Use a single Next.js project with Route Handlers as the API layer. No separate backend service.

## Rationale

1. **Reduced operational complexity.** One deployment target (Vercel), one CI pipeline, one set of environment variables, one TypeScript codebase. A separate backend doubles all of these.

2. **Route Handlers are sufficient.** The InkSpot API surface is simple: list artists, search, upload, OAuth callback, webhooks, cron handlers. None of these require long-running processes, persistent connections, or non-HTTP protocols. Route Handlers cover all cases.

3. **Shared types.** With a monorepo, the `types/` directory is shared between UI components and API handlers. No serialization layer, no schema duplication, no OpenAPI/tRPC overhead for a two-person team.

4. **Cron and webhook support.** Vercel provides native cron scheduling via `vercel.json`. Webhook endpoints are just Route Handlers with signature verification. No Inngest, no Bull, no separate worker process needed for MVP scope.

5. **Supabase handles persistence.** Supabase's client library works equally well in Route Handlers and Client Components. No ORM, no migration runner beyond the Supabase CLI.

## Tradeoffs

- **Function timeout limits.** Vercel Hobby: 10s (30s for streaming). Pro: 300s. The AI embedding batch scripts are run as `tsx` scripts locally, not as Route Handlers, to avoid this limit.
- **Cold starts.** Serverless functions have cold starts. For latency-sensitive paths (search), we rely on Vercel's edge caching and Supabase connection pooling (PgBouncer) to mitigate this.
- **If scale demands it:** extracting the embedding/AI batch work to a separate worker (Inngest, trigger.dev) is a clean cut-point since it's already isolated in `scripts/`. The Route Handler surface would not change.

## Alternatives Considered

- **Separate Express/Fastify API:** Doubles infrastructure, adds a network hop for SSR data fetching, complicates local development. Rejected.
- **Edge Functions only:** The Anthropic SDK and Supabase `pg` connection are not Edge-compatible. Rejected for all non-streaming routes.
- **tRPC:** Adds type-safety at the cost of a learning curve and a dependency. The app's API surface is small enough that Zod-validated Route Handlers are sufficient. Rejected.
