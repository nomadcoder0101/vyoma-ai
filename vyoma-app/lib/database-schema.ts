export type DatabaseTable = {
  name: string;
  purpose: string;
  owner: "account" | "profile" | "operations" | "assistant";
  keyFields: string[];
  notes: string;
};

export const databaseTables: DatabaseTable[] = [
  {
    name: "users",
    purpose: "Stores login identity and account-level ownership.",
    owner: "account",
    keyFields: ["id", "email", "name", "created_at", "updated_at"],
    notes: "Use auth provider IDs or map provider identities to this table.",
  },
  {
    name: "profiles",
    purpose: "Stores the confirmed career profile for each candidate.",
    owner: "profile",
    keyFields: [
      "id",
      "user_id",
      "candidate_name",
      "headline",
      "current_location",
      "work_authorization",
      "salary_expectation",
      "profile_description",
      "reason_for_change",
      "confirmed_at",
    ],
    notes: "Array fields such as roles, skills, locations, constraints, and memory can start as JSONB.",
  },
  {
    name: "resume_variants",
    purpose: "Stores resume versions and role-family positioning.",
    owner: "profile",
    keyFields: ["id", "profile_id", "name", "focus", "notes", "file_url", "created_at"],
    notes: "Later this can attach uploaded files through Vercel Blob, S3, or Supabase Storage.",
  },
  {
    name: "applications",
    purpose: "Stores applied roles imported from tracker or converted from leads.",
    owner: "operations",
    keyFields: [
      "id",
      "profile_id",
      "source_row_number",
      "applied_on",
      "company",
      "role",
      "url",
      "score",
      "status",
      "notes",
      "role_bucket",
    ],
    notes: "Keep imported tracker row number for traceability during migration.",
  },
  {
    name: "application_events",
    purpose: "Stores follow-ups, status changes, interview outcomes, rejections, and notes.",
    owner: "operations",
    keyFields: ["id", "application_id", "event_type", "pipeline_status", "note", "created_at"],
    notes: "This replaces tracker-actions.json and creates the learning trail for the assistant.",
  },
  {
    name: "leads",
    purpose: "Stores job, recruiter, and company leads before they become applications.",
    owner: "operations",
    keyFields: [
      "id",
      "profile_id",
      "type",
      "url",
      "title",
      "company",
      "notes",
      "status",
      "score",
      "evaluation",
      "next_action",
      "outreach_draft",
      "resume_recommendation",
    ],
    notes: "Use JSONB for generated evaluation payloads while the scoring model keeps changing.",
  },
  {
    name: "assistant_messages",
    purpose: "Stores profile-aware assistant conversations.",
    owner: "assistant",
    keyFields: ["id", "profile_id", "role", "content", "mode", "created_at"],
    notes: "Retain recent messages for context; archive or summarize older conversations.",
  },
  {
    name: "memories",
    purpose: "Stores durable learnings, risks, decisions, and next-action patterns.",
    owner: "assistant",
    keyFields: ["id", "profile_id", "type", "text", "source", "created_at"],
    notes: "This is the long-term learning layer used by recommendations and daily planning.",
  },
  {
    name: "daily_tasks",
    purpose: "Stores generated daily command-center tasks and completion state.",
    owner: "operations",
    keyFields: ["id", "profile_id", "task_date", "action_id", "type", "title", "detail", "href", "completed_at"],
    notes: "Generated tasks should be reproducible from tracker, leads, and memory.",
  },
  {
    name: "integration_accounts",
    purpose: "Stores official OAuth connection metadata.",
    owner: "account",
    keyFields: ["id", "user_id", "provider", "provider_account_id", "scopes", "expires_at"],
    notes: "Store OAuth tokens encrypted. Never store LinkedIn passwords.",
  },
];

export const migrationSteps = [
  "Create auth and users first so every record has an owner.",
  "Import the current Samruddhi profile into profiles and resume_variants.",
  "Import applications.md into applications while preserving source_row_number.",
  "Move tracker-actions.json into application_events.",
  "Move leads.json into leads.",
  "Move assistant-memory.json into assistant_messages and memories.",
  "Move daily-actions.json into daily_tasks or regenerate tasks after migration.",
];

export const migrationFiles = [
  {
    file: "migrations/0001_initial_schema.sql",
    purpose: "Creates the first production Postgres tables, constraints, and indexes.",
  },
  {
    file: "migrations/0002_updated_at_triggers.sql",
    purpose: "Adds updated_at triggers for mutable records.",
  },
  {
    file: "migrations/0003_profile_runtime_shape.sql",
    purpose: "Adds profile runtime ids, memory, and agent notes.",
  },
  {
    file: "migrations/0004_daily_task_action_ids.sql",
    purpose: "Adds stable daily action ids for generated task completion state.",
  },
];
