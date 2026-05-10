# Vyoma Production Database Schema

This is the first production data model for moving Vyoma AI from local JSON/Markdown files to a multi-user app.

## Recommended Database

Use Postgres for production. Vercel Postgres, Supabase Postgres, Neon, or Railway Postgres are all workable.

For the current product shape, Postgres is a better fit than a document-only store because the app needs:

- User-owned records
- Tracker filtering and follow-up queries
- Lead status transitions
- Application outcome history
- Assistant memory over time
- OAuth integration ownership

## Tables

### `users`

Stores login identity and account-level ownership.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `email` | text | Unique |
| `name` | text | Display name |
| `created_at` | timestamptz | Created timestamp |
| `updated_at` | timestamptz | Updated timestamp |

### `profiles`

Stores the confirmed career profile for each candidate.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `user_id` | uuid | References `users.id` |
| `candidate_name` | text | Candidate name |
| `headline` | text | Profile headline |
| `current_location` | text | Current location |
| `work_authorization` | text | Visa or work authorization context |
| `salary_expectation` | text | Flexible text for early product stage |
| `target_locations` | jsonb | Location preferences |
| `target_roles` | jsonb | Role families |
| `core_skills` | jsonb | Skills and keywords |
| `profile_description` | text | Agent-confirmed profile summary |
| `reason_for_change` | text | Relocation or job-change context |
| `constraints` | jsonb | Search constraints |
| `confirmed_at` | timestamptz | Null until confirmed |
| `created_at` | timestamptz | Created timestamp |
| `updated_at` | timestamptz | Updated timestamp |

### `resume_variants`

Stores resume versions and role-family positioning.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `profile_id` | uuid | References `profiles.id` |
| `name` | text | Resume variant name |
| `focus` | text | Target role family |
| `notes` | text | Usage notes |
| `file_url` | text | Optional uploaded file location |
| `file_name` | text | Original uploaded file name |
| `file_size` | integer | Uploaded file size in bytes |
| `content_type` | text | Uploaded MIME type |
| `full_text` | text | Full extracted resume text when parsing succeeds |
| `parsed_summary` | jsonb | Parser status, word counts, sections, role signals, and notes |
| `user_comment` | text | User-entered comment about the resume version |
| `uploaded_at` | timestamptz | Upload timestamp |
| `created_at` | timestamptz | Created timestamp |

### `applications`

Stores applied roles imported from tracker files or converted from leads.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `profile_id` | uuid | References `profiles.id` |
| `source_row_number` | integer | Original tracker row, if imported |
| `applied_on` | date | Application date |
| `company` | text | Company |
| `role` | text | Role title |
| `url` | text | Optional job URL |
| `score` | text | Imported score or model score |
| `status` | text | Imported status |
| `notes` | text | Application notes |
| `role_bucket` | text | KYC, TM, FCC, reporting, etc. |
| `created_at` | timestamptz | Created timestamp |
| `updated_at` | timestamptz | Updated timestamp |

### `application_events`

Stores follow-ups, status changes, interviews, rejections, offers, and notes.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `application_id` | uuid | References `applications.id` |
| `event_type` | text | follow_up, status_change, interview, rejection, offer, note |
| `pipeline_status` | text | applied, follow_up_sent, interview, rejected, offer, closed |
| `note` | text | User-entered or system-generated note |
| `created_at` | timestamptz | Created timestamp |

### `leads`

Stores job, recruiter, and company leads before they become applications.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `profile_id` | uuid | References `profiles.id` |
| `type` | text | job, recruiter, company |
| `url` | text | Source URL |
| `title` | text | Role, recruiter, or lead title |
| `company` | text | Company |
| `notes` | text | User notes or pasted JD |
| `status` | text | new, evaluated, drafted, contacted, archived |
| `score` | numeric | Fit score |
| `evaluation` | text | Generated evaluation |
| `next_action` | text | Recommended next step |
| `outreach_draft` | text | Generated outreach |
| `resume_recommendation` | jsonb | Resume recommendation payload |
| `created_at` | timestamptz | Created timestamp |
| `updated_at` | timestamptz | Updated timestamp |

### `assistant_messages`

Stores profile-aware assistant conversations.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `profile_id` | uuid | References `profiles.id` |
| `role` | text | user or assistant |
| `content` | text | Message content |
| `mode` | text | local or openai |
| `created_at` | timestamptz | Created timestamp |

### `memories`

Stores durable learnings, risks, decisions, and next-action patterns.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `profile_id` | uuid | References `profiles.id` |
| `type` | text | conversation, decision, risk, next_action |
| `text` | text | Memory content |
| `source` | text | assistant, tracker, profile, user |
| `created_at` | timestamptz | Created timestamp |

### `daily_tasks`

Stores generated daily command-center tasks and completion state.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `profile_id` | uuid | References `profiles.id` |
| `task_date` | date | Daily task date |
| `type` | text | follow_up, lead, resume, search, outreach |
| `title` | text | Task title |
| `detail` | text | Task detail |
| `href` | text | Optional app link |
| `completed_at` | timestamptz | Null until completed |
| `created_at` | timestamptz | Created timestamp |

### `integration_accounts`

Stores official OAuth connection metadata.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `user_id` | uuid | References `users.id` |
| `provider` | text | linkedin, google, etc. |
| `provider_account_id` | text | Provider-side ID |
| `scopes` | jsonb | Granted scopes |
| `access_token_encrypted` | text | Encrypted token |
| `refresh_token_encrypted` | text | Encrypted refresh token, if supplied |
| `expires_at` | timestamptz | Token expiry |
| `created_at` | timestamptz | Created timestamp |
| `updated_at` | timestamptz | Updated timestamp |

## Migration Order

1. Create auth and `users` first so every record has an owner.
2. Import `profiles/samruddhi.json` into `profiles` and `resume_variants`.
3. Import `applications.md` into `applications` while preserving `source_row_number`.
4. Move `tracker-actions.json` into `application_events`.
5. Move `leads.json` into `leads`.
6. Move `assistant-memory.json` into `assistant_messages` and `memories`.
7. Move `daily-actions.json` into `daily_tasks` or regenerate tasks after migration.

## SQL Migrations

The first provider-neutral Postgres migrations live in `migrations/`.

| File | Purpose |
| --- | --- |
| `migrations/0001_initial_schema.sql` | Creates core tables, constraints, and indexes |
| `migrations/0002_updated_at_triggers.sql` | Keeps mutable `updated_at` columns current |
| `migrations/0006_resume_file_details.sql` | Adds resume file metadata, full text, parsed summaries, and comments |

## Privacy Rules

- Do not store LinkedIn passwords.
- Store OAuth tokens encrypted.
- Keep every operational table scoped to `profile_id` or `user_id`.
- Treat resumes, tracker history, memory, and visa/work authorization notes as private user data.
