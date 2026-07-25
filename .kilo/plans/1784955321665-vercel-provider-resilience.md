# Fix manhwaread 500 Errors on Vercel — Provider DB Fallback

## Root Cause (confirmed via code inspection)
In `src/infrastructure/providers/initialize.ts`, `initializeBuiltinProviders()` does:
1. `prisma.provider.upsert(...)` — writes to DB
2. `prisma.provider.findUnique(...)` — reads back metadata
3. Only registers the provider **if** metadata exists

No error handling. If Vercel's Supabase pooler times out or is unreachable on cold start, the entire function throws, so no providers are registered, causing a 500 on the next route hit.

## Design
Make DB optional. Always register providers in-memory using data already available on the `Provider` object. Then upsert to the DB for stats/tracking. If the DB fails, log and continue with in-memory state.

### Tradeoffs
- **Pros**: App survives Vercel DB cold-start failures; zero 500s from init.
- **Cons**: On every cold start without DB, `enabled`/`hasX`/`nsfw` flags revert to builtin defaults (not admin-set overrides). Acceptable because builtin providers are static.
- **Out of scope**: No DB polling/retry; cache invalidation; admin override persistence.

## Tasks

### 1. `src/infrastructure/providers/initialize.ts`
- Register all builtin providers in-memory **before** touching the DB, using a fallback `InstalledProvider` constructed from the provider object.
- Wrap the DB `upsert` + `findUnique` in a single `try/catch`.
- On DB failure, log a warning including the error message; do **not** throw.
- Keep the successful DB path: overwrite the in-memory metadata with DB values (e.g., admin-set `description`, `icon`).

### 2. `src/application/services/search.service.ts`
- Wrap the `initializeBuiltinProviders()` call inside `findProvider()` with clearer error throwing so Vercel logs state whether init itself failed vs. a provider missing.
- Add a short log line before calling init for visibility.

## Validation
- Confirm `npm run build` passes.
- Confirm `npm run lint` passes.
- Confirm the final state of both files compiles and matches the design above.
