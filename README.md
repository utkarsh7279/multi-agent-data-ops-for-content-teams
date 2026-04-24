# Multi-Agent Data Ops for Content Teams

A production-oriented Next.js application that turns a Product Requirements Document (PRD) into a polished blog post using a four-step AI pipeline:

1. Researcher
2. Writer
3. Fact-checker
4. Style-polisher

The system stores intermediate artifacts in Supabase, logs every stage, supports rollback on fact-check failure, and exposes a clean UI for submission, timeline tracking, final output, and metrics.

The pipeline now runs asynchronously through a queued submitted job and a worker endpoint.

## Architecture

```text
PRD Submission UI
  -> /api/submit-prd
  -> Supabase: prds + jobs + audit logs
  -> /api/run-pipeline
  -> marks submitted job as queued
  -> /api/worker/process-next (Vercel cron)
  -> LangGraph Orchestrator
    -> Researcher
    -> Writer
    -> Fact-checker
    -> Style-polisher
  -> Supabase: outputs + sources + rubric_scores
  -> UI: Timeline / Final Output / Metrics Dashboard
```

## Project Structure

- `src/agents`: Researcher, Writer, Fact-checker, Style-polisher, orchestrator.
- `src/lib/llm`: Ollama (free local), OpenAI, and Anthropic provider abstraction with strict JSON parsing.
- `src/lib/search`: SerpAPI-backed search with deterministic fallback when key is missing.
- `src/lib/pipeline`: Worker logic for claiming and processing queued submitted jobs.
- `src/lib/supabase`: Admin client and persistence helpers.
- `src/app/api`: Submission, pipeline execution, and job status endpoints.
- `src/components`: UI primitives and feature-specific components.
- `supabase/migrations`: Database schema and migration scripts.
- `examples/prds`: Sample PRD inputs for local testing.
- `docs/architecture`: Design notes and folder/schema references.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file and set real values:

```bash
cp .env.example .env.local
```

Required environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Optional but recommended:

- `OLLAMA_BASE_URL` (defaults to `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (defaults to `llama3.1:8b`)
- `SERPAPI_API_KEY` (used by Researcher agent for real web search)
- `CRON_SECRET` (protects worker endpoint access)
- `OPENAI_API_KEY` (optional paid provider)
- `ANTHROPIC_API_KEY` (optional paid provider)

### Free permanent local LLM setup (recommended)

1. Install Ollama: https://ollama.com
2. Pull a model once:

```bash
ollama pull llama3.1:8b
```

3. Start Ollama locally:

```bash
ollama serve
```

The app defaults to `ollama`, so no OpenAI or Anthropic keys are required.

### One-command free setup and run

Run full free setup:

```bash
npm run setup:free
```

Start app plus local worker polling loop:

```bash
npm run start:free
```

This starts:
- Next.js dev server
- Worker poller (`scripts/worker-poller.mjs`) that calls `/api/worker/process-next` every 5 seconds

### 3. Apply Supabase schema

Run the migration in `supabase/migrations/20260423_001_init_schema.sql` against your Supabase project.

### 4. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Local Workflow

- Submit a PRD on the home page.
- The app creates a PRD row and a job row.
- The pipeline is queued through `/api/run-pipeline`.
- Worker endpoint processes queued jobs and runs researcher, writer, fact-checker, and style-polisher.
- Timeline, final output, and metrics pages read from the status API.

### Manual worker trigger (local)

If you are not running the local poller, trigger one queued job manually:

```bash
curl -X POST http://localhost:3000/api/worker/process-next
```

If `CRON_SECRET` is configured, send it as `x-cron-secret` header.

## Deployment

### Vercel

1. Import the repository into Vercel.
2. Set the required environment variables in the Vercel project settings.
3. Deploy the app.

`vercel.json` configures runtime timeouts and a cron schedule for the worker endpoint.

### Supabase

1. Create a Supabase project.
2. Enable the `vector` extension.
3. Apply the migration SQL.
4. Use the generated URL and service role key in your Vercel environment variables.

## Notes

- LLM responses are parsed as strict JSON with retries.
- Fact-check failure can trigger rollback and logging.
- Source records are stored separately so citations can remain stable.
- The repository includes placeholder PRDs and screenshot documentation for later validation.

## Tests

Run static checks and tests:

```bash
npm run lint
npm run test
```
