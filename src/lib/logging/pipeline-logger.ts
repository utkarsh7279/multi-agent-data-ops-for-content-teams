import { createSupabaseAdminClient } from "@/lib/supabase/client";
import { PipelineStage } from "@/lib/types/pipeline";
import { SourceRecord } from "@/lib/types/pipeline";

export async function logAuditEvent(
  prdId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("audit_logs")
    .insert({ prd_id: prdId, event_type: eventType, payload });

  if (error) {
    throw new Error(`Failed to log audit event: ${error.message}`);
  }
}

export async function createStageJob(prdId: string, stage: PipelineStage) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      prd_id: prdId,
      stage,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create stage job: ${error?.message ?? "unknown"}`);
  }

  return data.id as string;
}

export async function completeStageJob(
  jobId: string,
  status: "succeeded" | "failed" | "rolled_back",
  errorMessage?: string,
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("jobs")
    .update({
      status,
      error_message: errorMessage ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    throw new Error(`Failed to complete stage job: ${error.message}`);
  }
}

export async function storeStageOutput(
  prdId: string,
  stage: PipelineStage,
  content: Record<string, unknown>,
  meta: Record<string, unknown>,
  jobId?: string,
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("outputs").insert({
    prd_id: prdId,
    job_id: jobId ?? null,
    stage,
    content,
    meta,
  });

  if (error) {
    throw new Error(`Failed to store stage output: ${error.message}`);
  }
}

export async function storeSources(prdId: string, sources: SourceRecord[]) {
  if (sources.length === 0) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const rows = sources.map((source) => ({
    id: source.id,
    prd_id: prdId,
    url: source.url,
    title: source.title,
    snippet: source.snippet,
  }));

  const { error } = await supabase.from("sources").upsert(rows, { onConflict: "id" });
  if (error) {
    throw new Error(`Failed to store sources: ${error.message}`);
  }
}
