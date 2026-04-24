# Project Initialization

This guide captures the reproducible setup for local development.

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (for later steps)
- OpenAI and Anthropic API keys (for later steps)

## 1) Create the Project

```bash
mkdir -p ~/multi-agent-data-ops-for-content-teams
cd ~/multi-agent-data-ops-for-content-teams
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm
```

## 2) Install Dependencies

```bash
npm install
```

## 3) Verify Baseline

```bash
npm run lint
npm run dev
```

Open http://localhost:3000 to verify the app boots.

## 4) Create Architecture Directories

```bash
mkdir -p \
  src/agents \
  src/lib/{llm,supabase,parsers,logging,scoring,rollback,types,utils,langgraph} \
  src/app/api/{submit-prd,run-pipeline,job-status} \
  src/app/{timeline,final,dashboard} \
  src/components/{ui,forms,timeline,metrics,blog} \
  src/styles \
  supabase/{migrations,seeds} \
  docs/{architecture,screenshots} \
  examples/prds \
  scripts \
  tests/{unit,integration}
```

## 5) Next Step

Proceed to Step 2: Supabase SQL schema with pgvector and all required tables.
