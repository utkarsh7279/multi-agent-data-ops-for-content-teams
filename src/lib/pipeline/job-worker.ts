import { runPipelineOrchestrator } from "@/agents/orchestrator";
import { createSupabaseAdminClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/logging/pipeline-logger";

type SubmittedJobRow = {
  id: string;
  prd_id: string;
  payload: {
    provider?: "ollama" | "openai" | "anthropic";
    strictRetryEnabled?: boolean;
  } | null;
};

async function claimNextSubmittedJob(): Promise<SubmittedJobRow | null> {
  const supabase = createSupabaseAdminClient();

  const { data: candidate, error: readError } = await supabase
    .from("jobs")
    .select("id, prd_id, payload")
    .eq("stage", "submitted")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (readError) {
    throw new Error(`Failed to load queued jobs: ${readError.message}`);
  }

  if (!candidate) {
    return null;
  }

  const { data: claimed, error: claimError } = await supabase
    .from("jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
    })
    .eq("id", candidate.id)
    .eq("status", "queued")
    .select("id, prd_id, payload")
    .maybeSingle();

  if (claimError) {
    throw new Error(`Failed to claim queued job: ${claimError.message}`);
  }

  return (claimed as SubmittedJobRow | null) ?? null;
}

export async function processNextQueuedPipelineJob() {
  const supabase = createSupabaseAdminClient();
  const submittedJob = await claimNextSubmittedJob();

  if (!submittedJob) {
    return { processed: false, reason: "no_queued_jobs" as const };
  }

  const provider = submittedJob.payload?.provider ?? "ollama";
  const strictRetryEnabled = submittedJob.payload?.strictRetryEnabled ?? true;

  try {
    const { data: prd, error: prdError } = await supabase
      .from("prds")
      .select("id, title, source_text")
      .eq("id", submittedJob.prd_id)
      .single();

    if (prdError || !prd) {
      throw new Error(`PRD not found for job ${submittedJob.id}`);
    }

    await runPipelineOrchestrator({
      prdId: prd.id,
      title: prd.title,
      sourceText: prd.source_text,
      provider,
      strictRetryEnabled,
    });

    await supabase
      .from("jobs")
      .update({
        status: "succeeded",
        completed_at: new Date().toISOString(),
      })
      .eq("id", submittedJob.id);

    await logAuditEvent(prd.id, "submitted_job_processed", {
      job_id: submittedJob.id,
      provider,
      strict_retry_enabled: strictRetryEnabled,
    });

    return { processed: true, prdId: prd.id, jobId: submittedJob.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker failure";

    await supabase
      .from("jobs")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", submittedJob.id);

    await logAuditEvent(submittedJob.prd_id, "submitted_job_failed", {
      job_id: submittedJob.id,
      error: message,
    });

    return {
      processed: true,
      jobId: submittedJob.id,
      failed: true,
      error: message,
    };
  }
}
