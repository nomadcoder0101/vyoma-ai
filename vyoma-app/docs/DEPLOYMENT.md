# Vyoma AI Deployment Notes

## Current Mode

The app is deployed on Vercel and runs the core product data through Neon Postgres.

## Local Run

```powershell
cd "D:\Anand Backup\AI_Project\career-ops-main\vyoma-app"
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:3000
```

## Environment Variables

Copy `.env.example` to `.env.local`.

```powershell
Copy-Item .env.example .env.local
```

Set:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
VYOMA_STORAGE_MODE=postgres
INTEGRATION_ENCRYPTION_KEY=...
BLOB_READ_WRITE_TOKEN=...
```

For Postgres, use Neon through the Vercel Marketplace:

```text
DATABASE_URL=...
DATABASE_URL_UNPOOLED=...
POSTGRES_URL=...
POSTGRES_PRISMA_URL=...
POSTGRES_URL_NON_POOLING=...
```

Without `OPENAI_API_KEY`, the assistant uses local fallback logic.

## Vercel

The current production project is `vyoma-ai`.

Live aliases:

- `https://vyoma-ai.vercel.app`
- `https://vyomaai.in`
- `https://www.vyomaai.in`

## Remaining Production Work

- Add `BLOB_READ_WRITE_TOKEN` in Vercel and local `.env.local` to activate direct resume uploads.
- Add resume parsing after uploads are active.
- Add official LinkedIn OAuth credentials and approved scopes.
- Add official OAuth integrations where available.
- Keep LinkedIn password collection out of scope.

See `docs/AUTHENTICATION.md` for the recommended auth provider, route protection plan, and privacy rules.
See `docs/MIGRATION_PLAN.md` and `migrations/` for the Postgres migration scaffold.
See `docs/STORAGE_ADAPTER.md` for the local-to-Postgres storage boundary.
Use `npm.cmd run db:migrate` after adding Neon credentials.

## Recommended Production Stack

- Vercel for hosting
- Neon Postgres through the Vercel Marketplace for profile/tracker/leads/memory/daily tasks
- Blob storage for resumes
- OpenAI Responses API for assistant behavior
- Clerk for managed authentication
