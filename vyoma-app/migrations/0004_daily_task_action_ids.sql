alter table daily_tasks
add column if not exists action_id text;

update daily_tasks
set action_id = id::text
where action_id is null;

alter table daily_tasks
alter column action_id set not null;

create unique index if not exists daily_tasks_profile_date_action_idx
on daily_tasks(profile_id, task_date, action_id);
