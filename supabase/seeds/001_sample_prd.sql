-- Optional seed data for local development.
-- Safe to run multiple times due to ON CONFLICT clauses.

insert into prds (id, title, source_text)
values (
  '11111111-1111-1111-1111-111111111111',
  'AI-Powered Content Workflow',
  'Build a system that transforms PRDs into reliable publication-ready blog posts using a multi-agent pipeline.'
)
on conflict (id) do nothing;

insert into jobs (id, prd_id, stage, status, started_at, completed_at)
values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'researcher', 'succeeded', now() - interval '5 minutes', now() - interval '4 minutes'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'writer', 'running', now() - interval '2 minutes', null)
on conflict (id) do nothing;

insert into outputs (prd_id, job_id, stage, content, meta)
values (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  'researcher',
  '{"search_queries": ["multi-agent content pipeline", "fact checking workflow"], "sources": [{"id": "src-1", "url": "https://example.com", "title": "Example", "snippet": "Example snippet"}]}'::jsonb,
  '{"provider": "openai", "latency_ms": 1220}'::jsonb
);

insert into sources (id, prd_id, url, title, snippet)
values (
  'src-1',
  '11111111-1111-1111-1111-111111111111',
  'https://example.com',
  'Example Source',
  'Example evidence snippet for local testing.'
)
on conflict (id) do nothing;

insert into rubric_scores (prd_id, score, criteria_json)
values (
  '11111111-1111-1111-1111-111111111111',
  82.50,
  '{"clarity": 85, "accuracy": 80, "tone": 82.5}'::jsonb
);

select log_audit_event(
  '11111111-1111-1111-1111-111111111111',
  'seed_initialized',
  '{"source": "supabase/seeds/001_sample_prd.sql"}'::jsonb
);
