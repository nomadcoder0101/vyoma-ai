alter table resume_variants
add column if not exists file_name text,
add column if not exists file_size integer,
add column if not exists content_type text,
add column if not exists full_text text,
add column if not exists parsed_summary jsonb not null default '{}'::jsonb,
add column if not exists user_comment text not null default '',
add column if not exists uploaded_at timestamptz;
