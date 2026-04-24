import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/logging/pipeline-logger";

export const runtime = "nodejs";

const submitSchema = z.object({
  title: z.string().min(3),
  sourceText: z.string().min(20),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = submitSchema.parse(body);

    const supabase = createSupabaseAdminClient();

    const { data: prd, error: prdError } = await supabase
      .from("prds")
      .insert({ title: payload.title, source_text: payload.sourceText })
      .select("id")
      .single();

    if (prdError || !prd) {
      throw new Error(prdError?.message ?? "Failed to create PRD record.");
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        prd_id: prd.id,
        stage: "submitted",
        status: "queued",
      })
      .select("id")
      .single();

    if (jobError || !job) {
      throw new Error(jobError?.message ?? "Failed to create job record.");
    }

    await logAuditEvent(prd.id, "prd_submitted", {
      title: payload.title,
      submitted_job_id: job.id,
    });

    return NextResponse.json({ prdId: prd.id, jobId: job.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
