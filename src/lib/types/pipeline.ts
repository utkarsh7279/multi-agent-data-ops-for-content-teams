export const PIPELINE_STAGES = [
  "submitted",
  "researcher",
  "writer",
  "fact_checker",
  "style_polisher",
  "completed",
  "rolled_back",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const JOB_STATUSES = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "rolled_back",
  "cancelled",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export type SourceRecord = {
  id: string;
  url: string;
  title: string;
  snippet: string;
};

export type ResearcherOutput = {
  search_queries: string[];
  sources: SourceRecord[];
};

export type WriterOutput = {
  title: string;
  draft: string;
};

export type FactCheckerOutput = {
  claims: string[];
  failed: boolean;
  summary: string;
};

export type StylistOutput = {
  title: string;
  final_blog: string;
};

export type PipelineTimelineItem = {
  stage: PipelineStage;
  status: JobStatus;
  started_at: string | null;
  completed_at: string | null;
  latency_ms?: number;
};
