# Vyoma Local-to-Postgres Migration Notes

The current app can seed and operate core data through Postgres. These notes document the source-to-table mapping and the checks to keep local backup data aligned with production.

## Source Files

| Source | Target |
| --- | --- |
| `../data/profiles/samruddhi.json` | `profiles`, `resume_variants`, profile memory into `memories` |
| `../data/applications.md` | `applications` |
| `../data/tracker-actions.json` | `application_events` |
| `../data/leads.json` | `leads` |
| `../data/assistant-memory.json` | `assistant_messages`, `memories` |
| `../data/daily-actions.json` | `daily_tasks` or regenerated daily state |

## Migration Sequence Implemented In Repositories

1. Create or fetch the signed-in user account.
2. Insert the active career profile under that `user_id`.
3. Insert each resume template as a `resume_variants` row.
4. Parse `applications.md` into `applications`, preserving the original tracker number in `source_row_number`.
5. Convert tracker overlay statuses and notes into `application_events`.
6. Insert captured leads and generated evaluation state into `leads`.
7. Split assistant memory into short-term `assistant_messages` and durable `memories`.
8. Regenerate daily tasks from applications and leads, or import completion state where the task ID is still meaningful.

## Verification Checks

- Application count matches the imported tracker row count.
- Every application belongs to the pilot `profile_id`.
- Every lead belongs to the pilot `profile_id`.
- Memory count is reasonable and does not duplicate profile default memories unnecessarily.
- No LinkedIn passwords or browser credentials are present in any imported record.

## Cutover Rule

Keep local files as backup. The database-backed app can:

- Load the dashboard
- Update tracker status
- Add and evaluate leads
- Save assistant memory
- Mark daily tasks complete
- Recommend resume variants
