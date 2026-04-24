-- Step 2: Initial schema for Multi-Agent Data Ops for Content Teams
-- Design goals:
-- 1) Keep every pipeline stage traceable.
-- 2) Support rollback and retry behavior.
-- 3) Store structured outputs and source embeddings for later retrieval.

begin;

create extension if not exists pgcrypto;
create extension if not exists vector;

-- Pipeline stage vocabulary used by jobs and outputs.
create type pipeline_stage as enum (
  'submitted',
  'researcher',
  'writer',
  'fact_checker',
  'style_polisher',
  'completed',
  'rolled_back'
);

-- Runtime state for orchestration jobs.
create type job_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed',
  'rolled_back',
  'cancelled'
);

create table if not exists prds (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  source_text text not null check (char_length(trim(source_text)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  prd_id uuid not null references prds(id) on delete cascade,
  stage pipeline_stage not null default 'submitted',
  status job_status not null default 'queued',
  retry_count integer not null default 0 check (retry_count >= 0),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table if not exists outputs (
  id uuid primary key default gen_random_uuid(),
  prd_id uuid not null references prds(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  stage pipeline_stage not null,
  content jsonb not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sources (
  -- Source ids map directly to in-article citations like [src-1].
  id text primary key,
  prd_id uuid not null references prds(id) on delete cascade,
  url text not null,
  title text not null,
  snippet text not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (prd_id, url)
);

create table if not exists rubric_scores (
  id uuid primary key default gen_random_uuid(),
  prd_id uuid not null references prds(id) on delete cascade,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  criteria_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  prd_id uuid not null references prds(id) on delete cascade,
  event_type text not null check (char_length(trim(event_type)) > 0),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_jobs_prd_created_at on jobs (prd_id, created_at desc);
create index if not exists idx_jobs_status on jobs (status);
create index if not exists idx_outputs_prd_stage_created_at on outputs (prd_id, stage, created_at desc);
create index if not exists idx_sources_prd on sources (prd_id);
create index if not exists idx_rubric_scores_prd_created_at on rubric_scores (prd_id, created_at desc);
create index if not exists idx_audit_logs_prd_created_at on audit_logs (prd_id, created_at desc);

-- Vector index for semantic source retrieval.
create index if not exists idx_sources_embedding_cosine
on sources using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Keep jobs.updated_at accurate without app-level bookkeeping.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_jobs_set_updated_at
before update on jobs
for each row
execute function set_updated_at();

-- Convenience function for explicit audit logging from API/agents.
create or replace function log_audit_event(
  p_prd_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb
)
returns void
language sql
as $$
  insert into audit_logs (prd_id, event_type, payload)
  values (p_prd_id, p_event_type, coalesce(p_payload, '{}'::jsonb));
$$;

-- Timeline view used by frontend timeline page and status polling APIs.
create or replace view v_pipeline_timeline as
select
  j.id as job_id,
  j.prd_id,
  j.stage,
  j.status,
  j.retry_count,
  j.error_message,
  j.started_at,
  j.completed_at,
  j.created_at as job_created_at,
  o.id as output_id,
  o.created_at as output_created_at
from jobs j
left join outputs o
  on o.job_id = j.id
  and o.stage = j.stage;

commit;
