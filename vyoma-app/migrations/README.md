# Vyoma Database Migrations

These SQL files are provider-neutral Postgres migrations for the production app.

## Files

| File | Purpose |
| --- | --- |
| `0001_initial_schema.sql` | Core account, profile, tracker, lead, resume, assistant memory, task, and integration tables |
| `0002_updated_at_triggers.sql` | Shared trigger for mutable `updated_at` columns |
| `0003_profile_runtime_shape.sql` | Runtime profile fields needed to round-trip the current app profile |

## Run Order

Run files in numeric order against a Postgres database.

With Neon credentials in `.env.local`, run:

```powershell
npm.cmd run db:migrate
```

## Provider Notes

- Vercel Postgres, Neon, Supabase, and Railway Postgres can all run this schema.
- Supabase projects usually already include useful auth tables. If using Supabase Auth, keep Vyoma's `users` table as an app-level profile/ownership table mapped to Supabase auth identities.
- OAuth token columns are reserved for official integrations and must be written only through the encrypted integration repository.

## Current App Mode

The app still reads and writes local files. These migrations prepare the database target; they do not switch runtime storage yet.
