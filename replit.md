# Skin by Jenan

An English-language skincare storefront with a Supabase-backed product catalog, guest cart, wishlist, contact inbox, and newsletter signups.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `SUPABASE_URL` — Supabase project URL; `SUPABASE_SECRET_KEY` — server-only Supabase key; `SESSION_SECRET` — signs guest-store cookies.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/skin-by-jenan/` — storefront UI and generated API client usage
- `artifacts/api-server/src/routes/store.ts` — server-side Supabase integration and store endpoints
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `supabase/migrations/` — applied Supabase schema and seed migration

## Architecture decisions

- The Supabase MCP connection is for agent-side database management; the live storefront calls the shared API server, not MCP.
- Supabase secret keys stay in Replit Secrets on the API server and never ship to the browser.
- Guest carts and wishlists use a signed, HTTP-only browser session cookie; customers do not need an account for this demo.
- Store tables have RLS enabled and no public policies; the server uses its private Supabase key for data access.

## Product

- Product browsing, live search, filters, sorting, a mask-matching quiz, and a persistent guest cart and wishlist.
- Contact messages and newsletter signups are stored in Supabase; no email is sent automatically.

## User preferences

-

## Gotchas

- Keep the Supabase secret key server-side. Do not add `VITE_` prefixes or embed it in the storefront.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
