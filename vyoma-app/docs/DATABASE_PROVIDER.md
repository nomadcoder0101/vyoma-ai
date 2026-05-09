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

## Wiring Status

1. Neon database is connected through Vercel environment variables.
2. Local credentials live in `.env.local`.
3. Migrations run with `npm.cmd run db:migrate`.
4. `lib/database.ts` provides the shared query helper and health check.
5. Profile, tracker, leads, daily tasks, and assistant memory have Postgres repositories.
6. `VYOMA_STORAGE_MODE=postgres` is the production runtime.

## Migration Runner

The app includes:

```powershell
npm.cmd run db:migrate
```

The runner loads `.env.local`, then runs the SQL files in `migrations/` in numeric order.

## Converted Repositories

- Profile can create the signed-in user, save the current profile, and round-trip resume variants through `profiles` and `resume_variants`.
- Leads can list, create, evaluate, draft outreach, mark contacted, archive, recommend a resume variant, and convert a lead into an `applications` row.
- Tracker can seed imported applications into `applications`, load them, and save pipeline events into `application_events`.
- Daily tasks can persist completed daily action ids into `daily_tasks`.
- Assistant memory can persist chat messages into `assistant_messages` and learnings into `memories`.

## Health Check

The app exposes:

```text
GET /api/database
```

Without Postgres environment variables, the endpoint reports a skipped ping. With credentials set, it runs a lightweight `select 1 as ok` through the Neon serverless driver.
