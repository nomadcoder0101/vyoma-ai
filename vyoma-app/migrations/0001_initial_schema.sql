-- Vyoma AI initial production schema.
-- Target: Postgres 14+.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  auth_provider text,
  auth_provider_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  candidate_name text not null,
  headline text not null default '',
  current_location text not null default '',
  work_authorization text not null default '',
  salary_expectation text not null default '',
  target_locations jsonb not null default '[]'::jsonb,
  target_roles jsonb not null default '[]'::jsonb,
  core_skills jsonb not null default '[]'::jsonb,
  profile_description text not null default '',
  reason_for_change text not null default '',
  constraints jsonb not null default '[]'::jsonb,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists resume_variants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  focus text not null default '',
  notes text not null default '',
  file_url text,
  file_name text,
  file_size integer,
  content_type text,
  full_text text,
  parsed_summary jsonb not null default '{}'::jsonb,
  user_comment text not null default '',
  uploaded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  source_row_number integer,
  applied_on date,
  company text not null default '',
  role text not null default '',
  url text,
  score text not null default '',
  status text not null default 'applied',
  notes text not null default '',
  role_bucket text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, source_row_number)
);

create table if not exists application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  event_type text not null,
  pipeline_status text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint application_events_event_type_check check (
    event_type in ('follow_up', 'status_change', 'interview', 'rejection', 'offer', 'note')
  ),
  constraint application_events_pipeline_status_check check (
    pipeline_status in ('applied', 'follow_up_sent', 'interview', 'rejected', 'offer', 'closed')
  )
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  url text not null default '',
  title text not null default '',
  company text not null default '',
  notes text not null default '',
  status text not null default 'new',
  score numeric(3, 1),
  evaluation text,
  next_action text,
  outreach_draft text,
  resume_recommendation jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_type_check check (type in ('job', 'recruiter', 'company')),
  constraint leads_status_check check (status in ('new', 'evaluated', 'drafted', 'contacted', 'archived'))
);

create table if not exists assistant_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null,
  content text not null,
  mode text not null default 'local',
  created_at timestamptz not null default now(),
  constraint assistant_messages_role_check check (role in ('user', 'assistant')),
  constraint assistant_messages_mode_check check (mode in ('local', 'openai'))
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  text text not null,
  source text not null default 'assistant',
  created_at timestamptz not null default now(),
  constraint memories_type_check check (type in ('conversation', 'decision', 'risk', 'next_action')),
  constraint memories_source_check check (source in ('assistant', 'tracker', 'profile', 'user'))
);

create table if not exists daily_tasks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  task_date date not null,
  type text not null,
  title text not null,
  detail text not null default '',
  href text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint daily_tasks_type_check check (type in ('follow_up', 'lead', 'resume', 'search', 'outreach'))
);

create table if not exists integration_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null,
  provider_account_id text not null,
  scopes jsonb not null default '[]'::jsonb,
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_account_id)
);

create index if not exists profiles_user_id_idx on profiles(user_id);
create index if not exists resume_variants_profile_id_idx on resume_variants(profile_id);
create index if not exists applications_profile_id_applied_on_idx on applications(profile_id, applied_on desc);
create index if not exists applications_profile_id_status_idx on applications(profile_id, status);
create index if not exists application_events_application_id_created_at_idx on application_events(application_id, created_at desc);
create index if not exists leads_profile_id_status_idx on leads(profile_id, status);
create index if not exists leads_profile_id_created_at_idx on leads(profile_id, created_at desc);
create index if not exists assistant_messages_profile_id_created_at_idx on assistant_messages(profile_id, created_at desc);
create index if not exists memories_profile_id_created_at_idx on memories(profile_id, created_at desc);
create index if not exists daily_tasks_profile_id_task_date_idx on daily_tasks(profile_id, task_date desc);
create index if not exists integration_accounts_user_id_provider_idx on integration_accounts(user_id, provider);
