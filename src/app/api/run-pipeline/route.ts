import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/logging/pipeline-logger";
import { processNextQueuedPipelineJob } from "@/lib/pipeline/job-worker";

export const runtime = "nodejs";

const runSchema = z.object({
  prdId: z.string().uuid(),
  provider: z.enum(["ollama", "openai", "anthropic"]).default("ollama"),
  strictRetryEnabled: z.boolean().optional(),
  executeNow: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = runSchema.parse(body);

    const supabase = createSupabaseAdminClient();
    const { data: prd, error } = await supabase
      .from("prds")
      .select("id, title, source_text")
      .eq("id", payload.prdId)
      .single();

    if (error || !prd) {
      throw new Error("PRD not found.");
    }

    const { data: submittedJob, error: submittedJobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("prd_id", prd.id)
      .eq("stage", "submitted")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (submittedJobError) {
      throw new Error(`Failed to find submitted job: ${submittedJobError.message}`);
    }

    if (!submittedJob) {
      throw new Error("No submitted job found for PRD.");
    }

    const { error: enqueueError } = await supabase
      .from("jobs")
      .update({
        status: "queued",
        started_at: null,
        completed_at: null,
        error_message: null,
        payload: {
          provider: payload.provider,
          strictRetryEnabled: payload.strictRetryEnabled ?? true,
        },
      })
      .eq("id", submittedJob.id);

    if (enqueueError) {
      throw new Error(`Failed to enqueue pipeline job: ${enqueueError.message}`);
    }

    await logAuditEvent(prd.id, "pipeline_enqueued", {
      job_id: submittedJob.id,
      provider: payload.provider,
      strict_retry_enabled: payload.strictRetryEnabled ?? true,
      execute_now: payload.executeNow,
    });

    if (payload.executeNow) {
      const workerResult = await processNextQueuedPipelineJob();
      return NextResponse.json(
        {
          prdId: prd.id,
          jobId: submittedJob.id,
          queued: true,
          workerResult,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        prdId: prd.id,
        jobId: submittedJob.id,
        queued: true,
      },
      { status: 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline run failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
