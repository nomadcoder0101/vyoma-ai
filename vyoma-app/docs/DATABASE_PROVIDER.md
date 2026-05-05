# Vyoma Database Provider Path

## Selected Path

Use Neon Postgres through the Vercel Marketplace for the first production version.

Recommended package:

```powershell
npm.cmd install @neondatabase/serverless
```

## Why This Path

- Matches Vercel's current Marketplace Postgres path.
- Keeps the app on standard Postgres.
- Works well with the SQL migrations already in `migrations/`.
- Does not force Supabase Auth before the auth provider is finalized.
- Uses Neon's actively maintained serverless driver instead of deprecated `@vercel/postgres`.

## Environment Variables

Neon commonly provides:

```text
DATABASE_URL=...
DATABASE_URL_UNPOOLED=...
POSTGRES_URL=...
POSTGRES_PRISMA_URL=...
POSTGRES_URL_NON_POOLING=...
```

The app currently treats `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_URL`, or `POSTGRES_PRISMA_URL` as a sign that database credentials exist.

## Wiring Steps

1. Create a Neon database through the Vercel Marketplace.
2. Add Neon credentials to `.env.local`.
3. Run `npm.cmd run db:migrate`.
4. Use the query helper in `lib/database.ts`.
5. Implement Postgres repositories one area at a time.
6. Switch `VYOMA_STORAGE_MODE=postgres` only after parity checks pass.

## Migration Runner

The app includes:

```powershell
npm.cmd run db:migrate
```

The runner loads `.env.local`, then runs the SQL files in `migrations/` in numeric order.

## First Repository

The profile repository is the first Postgres-backed runtime repository. It can create the pilot user, save the current profile, and round-trip resume variants through `profiles` and `resume_variants`.

## Health Check

The app exposes:

```text
GET /api/database
```

Without Postgres environment variables, the endpoint reports a skipped ping. With credentials set, it runs a lightweight `select 1 as ok` through the Neon serverless driver.
