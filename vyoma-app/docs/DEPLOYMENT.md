# Vyoma AI Deployment Notes

## Current Mode

The app currently runs as a local Next.js prototype using JSON and Markdown files under the parent `data/` directory.

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
VYOMA_STORAGE_MODE=local
```

For production Postgres later, use Neon through the Vercel Marketplace:

```text
DATABASE_URL=...
DATABASE_URL_UNPOOLED=...
POSTGRES_URL=...
POSTGRES_PRISMA_URL=...
POSTGRES_URL_NON_POOLING=...
```

Without `OPENAI_API_KEY`, the assistant uses local fallback logic.

## Vercel Plan

1. Push this app to a Git repository.
2. Import `vyoma-app` as the Vercel project root.
3. Add environment variables in Vercel project settings.
4. Configure `app.vyomaai.in` as a Vercel domain.
5. Update DNS records as Vercel instructs.

## Production Blockers

- Replace local JSON/Markdown storage with a database.
- Add production authentication.
- Add secure resume upload/storage.
- Add encrypted secrets.
- Add official OAuth integrations where available.
- Keep LinkedIn password collection out of scope.

See `docs/AUTHENTICATION.md` for the recommended auth provider, route protection plan, and privacy rules.
See `docs/MIGRATION_PLAN.md` and `migrations/` for the Postgres migration scaffold.
See `docs/STORAGE_ADAPTER.md` for the local-to-Postgres storage boundary.
Use `npm.cmd run db:migrate` after adding Neon credentials.

## Recommended Production Stack

- Vercel for hosting
- Neon Postgres through the Vercel Marketplace for profile/tracker/leads/memory
- Blob storage for resumes
- OpenAI Responses API for assistant behavior
- Auth provider such as Auth.js, Clerk, or Supabase Auth
