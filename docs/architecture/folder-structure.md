# Folder Structure

This repository follows a modular structure designed for production maintainability.

```text
multi-agent-data-ops-for-content-teams/
├── docs/
│   ├── architecture/
│   └── screenshots/
├── examples/
│   └── prds/
├── public/
├── scripts/
├── src/
│   ├── agents/
│   ├── app/
│   │   ├── api/
│   │   │   ├── submit-prd/
│   │   │   ├── run-pipeline/
│   │   │   └── job-status/
│   │   ├── dashboard/
│   │   ├── final/
│   │   └── timeline/
│   ├── components/
│   │   ├── blog/
│   │   ├── forms/
│   │   ├── metrics/
│   │   ├── timeline/
│   │   └── ui/
│   ├── lib/
│   │   ├── langgraph/
│   │   ├── llm/
│   │   ├── logging/
│   │   ├── parsers/
│   │   ├── rollback/
│   │   ├── scoring/
│   │   ├── supabase/
│   │   ├── types/
│   │   └── utils/
│   └── styles/
├── supabase/
│   ├── migrations/
│   └── seeds/
└── tests/
    ├── integration/
    └── unit/
```

## Design Notes

- `src/agents`: Individual agent modules (researcher, writer, fact-checker, stylist) and orchestrator wiring.
- `src/lib/llm`: Provider abstraction for OpenAI and Anthropic.
- `src/lib/langgraph`: LangGraph state and graph construction utilities.
- `src/lib/supabase`: Database client and persistence helpers.
- `src/app/api`: API endpoints for submission, pipeline execution, and status polling.
- `src/components`: UI by feature domain to keep route files thin.
- `supabase/migrations`: SQL schema and migration scripts.
- `tests`: Unit/integration coverage for agents, API routes, and orchestration behavior.
