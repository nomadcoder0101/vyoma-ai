# Vyoma App Data Contract

## Storage Contract

The production app stores core runtime data in Postgres. The parent repository `data/` folder remains a local backup/source import record.

## User Data

Do not delete or overwrite these files without explicit user approval.

| File | Purpose |
| --- | --- |
| `../data/applications.md` | Imported application tracker from the spreadsheet |
| `../data/profiles/samruddhi.json` | Confirmed pilot profile |
| `../data/leads.json` | Captured job, recruiter, and company leads |
| `../data/assistant-memory.json` | Assistant chat history and learned memory |
| `../data/tracker-actions.json` | App-side tracker status and notes overlay |
| `../data/daily-actions.json` | Daily command checklist completion state |

## App Code

The `vyoma-app/app`, `vyoma-app/lib`, and `vyoma-app/docs` folders are application code and documentation. They can be changed during development.

## Design Principle

`applications.md` is treated as imported source history. App updates should not rewrite it for routine status changes. Use overlay files such as `tracker-actions.json` for app-side state.

## Database Mapping

| Local file | Production table |
| --- | --- |
| `profiles/samruddhi.json` | `profiles` |
| `leads.json` | `leads` |
| `applications.md` | `applications` |
| `tracker-actions.json` | `application_events` |
| `assistant-memory.json` | `memories`, `assistant_messages` |
| `daily-actions.json` | `daily_tasks` |

See `docs/DATABASE_SCHEMA.md` for the production table design, migration order, and privacy rules.
See `docs/STORAGE_ADAPTER.md` for the runtime storage boundary.
