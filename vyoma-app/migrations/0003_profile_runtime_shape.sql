alter table profiles
add column if not exists external_id text;

alter table profiles
add column if not exists memory jsonb not null default '[]'::jsonb;

alter table profiles
add column if not exists agent_notes jsonb not null default '[]'::jsonb;

create unique index if not exists profiles_user_id_external_id_idx
on profiles(user_id, external_id)
where external_id is not null;
