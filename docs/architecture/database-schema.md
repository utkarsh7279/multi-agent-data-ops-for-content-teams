# Supabase Database Schema

This schema is defined in:
- `supabase/migrations/20260423_001_init_schema.sql`

## Extensions

- `pgcrypto`: UUID generation (`gen_random_uuid()`)
- `vector`: pgvector support for source embeddings

## Enums

- `pipeline_stage`: `submitted | researcher | writer | fact_checker | style_polisher | completed | rolled_back`
- `job_status`: `queued | running | succeeded | failed | rolled_back | cancelled`

## Required Tables

### `prds`
- `id` (uuid, pk)
- `title` (text)
- `source_text` (text)
- `created_at` (timestamptz)

### `jobs`
- `id` (uuid, pk)
- `prd_id` (uuid, fk -> prds)
- `stage` (pipeline_stage)
- `status` (job_status)
- `retry_count` (integer)
- `error_message` (text)
- `started_at` (timestamptz)
- `completed_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

### `outputs`
- `id` (uuid, pk)
- `prd_id` (uuid, fk -> prds)
- `job_id` (uuid, fk -> jobs)
- `stage` (pipeline_stage)
- `content` (jsonb)
- `meta` (jsonb)
- `created_at` (timestamptz)

### `sources`
- `id` (text, pk; citation id such as `src-1`)
- `prd_id` (uuid, fk -> prds)
- `url` (text)
- `title` (text)
- `snippet` (text)
- `embedding` (vector(1536))
- `created_at` (timestamptz)

### `rubric_scores`
- `id` (uuid, pk)
- `prd_id` (uuid, fk -> prds)
- `score` (numeric 0..100)
- `criteria_json` (jsonb)
- `created_at` (timestamptz)

### `audit_logs`
- `id` (uuid, pk)
- `prd_id` (uuid, fk -> prds)
- `event_type` (text)
- `payload` (jsonb)
- `created_at` (timestamptz)

## Helpers

- Trigger: `trg_jobs_set_updated_at` keeps `jobs.updated_at` synchronized.
- Function: `log_audit_event(prd_id, event_type, payload)` for standardized audit writes.
- View: `v_pipeline_timeline` to power timeline UI and status APIs.

## Seed File

- `supabase/seeds/001_sample_prd.sql` contains optional local demo data.
