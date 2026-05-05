# Vyoma Storage Adapter Boundary

The app currently runs on local files. The production target is Postgres.

This boundary exists so we can migrate in stages without rewriting every page and API at once.

## Current Runtime

Set by:

```text
VYOMA_STORAGE_MODE=local
```

Local mode uses:

- `../data/profiles/samruddhi.json`
- `../data/applications.md`
- `../data/leads.json`
- `../data/assistant-memory.json`
- `../data/tracker-actions.json`
- `../data/daily-actions.json`

## Future Runtime

Set by:

```text
VYOMA_STORAGE_MODE=postgres
DATABASE_URL=...
```

Postgres mode is designed but not active. The SQL migrations are ready under `migrations/`.

`lib/database.ts` is the shared database readiness boundary. It checks `DATABASE_URL` and keeps every Postgres repository blocked until a driver and real query implementation are wired.

See `docs/DATABASE_PROVIDER.md` for the selected Neon through Vercel Marketplace provider path.

## Repository Areas To Convert

| Area | Current module | Future table |
| --- | --- | --- |
| Profile | `lib/profile.ts` repository boundary added | `profiles`, `resume_variants`, `memories` |
| Tracker | `lib/tracker.ts` repository boundary added | `applications`, `application_events` |
| Leads | `lib/leads.ts` repository boundary added | `leads`, `applications` |
| Assistant | `lib/assistant.ts` repository boundary added | `assistant_messages`, `memories` |
| Daily tasks | `lib/daily-command.ts` repository boundary added | `daily_tasks` |
| Integrations | `lib/integrations.ts` repository boundary added | `integration_accounts` |

## Cutover Pattern

1. Keep local file functions working.
2. Add Postgres repository functions beside each local implementation.
3. Route through `VYOMA_STORAGE_MODE`.
4. Run local and Postgres parity checks.
5. Switch production to Postgres only after dashboard, tracker, leads, assistant memory, and daily plan all pass.

## Database Boundary

| File | Purpose |
| --- | --- |
| `lib/database.ts` | Shared Postgres readiness and blocked-repository errors |
| `app/api/database/route.ts` | Database readiness and Neon ping endpoint |
| `migrations/0001_initial_schema.sql` | Initial table schema |
| `migrations/0002_updated_at_triggers.sql` | Updated timestamp triggers |

## Current Conversion Status

| Area | Local source | Postgres target | Status |
| --- | --- | --- | --- |
| Profile | `profiles/samruddhi.json` | `profiles`, `resume_variants`, `memories` | Repository boundary added; local implementation active; Postgres intentionally blocked |
| Tracker | `applications.md`, `tracker-actions.json` | `applications`, `application_events` | Repository boundary added; local implementation active; Postgres intentionally blocked |
| Leads | `leads.json`, `applications.md` | `leads`, `applications` | Repository boundary added; local implementation active; Postgres intentionally blocked |
| Assistant memory | `assistant-memory.json` | `assistant_messages`, `memories` | Repository boundary added; local implementation active; Postgres intentionally blocked |
| Daily tasks | `daily-actions.json` | `daily_tasks` | Repository boundary added; local implementation active; Postgres intentionally blocked |
| Integrations | none | `integration_accounts` | Repository boundary added; local token storage disabled; Postgres intentionally blocked |

## Safety Rule

Do not enable `VYOMA_STORAGE_MODE=postgres` in production until the repository methods are implemented and verified.
