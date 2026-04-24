begin;

alter table jobs
add column if not exists payload jsonb not null default '{}'::jsonb;

create index if not exists idx_jobs_stage_status_created_at
on jobs (stage, status, created_at asc);

commit;
