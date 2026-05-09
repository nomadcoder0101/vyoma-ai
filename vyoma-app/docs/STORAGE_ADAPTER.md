# Vyoma Storage Adapter Boundary

The app currently runs on local files. The production target is Postgres.

This boundary exists so local pilot data and Postgres production data can share repository contracts.

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

Profile, tracker, leads, assistant memory, and daily tasks have Postgres repository implementations; integrations are still blocked until encrypted OAuth token storage is implemented. The SQL migrations live under `migrations/`.

`lib/database.ts` is the shared database readiness boundary. It checks `DATABASE_URL`, exposes the Neon query helper, and gives unconverted repositories one consistent blocked-path error.

See `docs/DATABASE_PROVIDER.md` for the selected Neon through Vercel Marketplace provider path.

## Repository Areas To Convert

| Area | Current module | Future table |
| --- | --- | --- |
| Profile | `lib/profile.ts` repository boundary added | `profiles`, `resume_variants`, `memories` |
| Tracker | `lib/tracker.ts` local and Postgres repositories | `applications`, `application_events` |
| Leads | `lib/leads.ts` local and Postgres repositories | `leads`, `applications` |
| Assistant | `lib/assistant.ts` local and Postgres repositories | `assistant_messages`, `memories` |
| Daily tasks | `lib/daily-command.ts` local and Postgres repositories | `daily_tasks` |
| Integrations | `lib/integrations.ts` repository boundary added | `integration_accounts` |

## Cutover Pattern

1. Keep local file functions working.
2. Add Postgres repository functions beside each local implementation.
3. Route through `VYOMA_STORAGE_MODE`.
4. Run local and Postgres parity checks.
5. Keep integrations blocked until encrypted OAuth token storage passes review.

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
| Profile | `profiles/samruddhi.json` | `profiles`, `resume_variants`, `memories` | Local and Postgres implementations exist; runtime follows `VYOMA_STORAGE_MODE` |
| Tracker | `applications.md`, `tracker-actions.json` | `applications`, `application_events` | Local and Postgres implementations exist; runtime follows `VYOMA_STORAGE_MODE` |
| Leads | `leads.json`, `applications.md` | `leads`, `applications` | Local and Postgres implementations exist; runtime follows `VYOMA_STORAGE_MODE` |
| Assistant memory | `assistant-memory.json` | `assistant_messages`, `memories` | Local and Postgres implementations exist; runtime follows `VYOMA_STORAGE_MODE` |
| Daily tasks | `daily-actions.json` | `daily_tasks` | Local and Postgres implementations exist; runtime follows `VYOMA_STORAGE_MODE` |
| Integrations | none | `integration_accounts` | Repository boundary added; local token storage disabled; Postgres intentionally blocked |

## Safety Rule

Do not enable credential-bearing integrations until encrypted OAuth storage is implemented and verified. The core career operations runtime can now be tested in `VYOMA_STORAGE_MODE=postgres`.
