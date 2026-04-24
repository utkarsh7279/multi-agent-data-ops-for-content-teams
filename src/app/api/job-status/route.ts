import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const prdId = url.searchParams.get("prdId");

    if (!prdId) {
      return NextResponse.json({ error: "prdId query param is required" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const [{ data: timeline, error: timelineError }, { data: outputs, error: outputsError }, { data: score, error: scoreError }] =
      await Promise.all([
        supabase
          .from("v_pipeline_timeline")
          .select("*")
          .eq("prd_id", prdId)
          .order("job_created_at", { ascending: true }),
        supabase
          .from("outputs")
          .select("stage, content, meta, created_at")
          .eq("prd_id", prdId)
          .order("created_at", { ascending: true }),
        supabase
          .from("rubric_scores")
          .select("score, criteria_json, created_at")
          .eq("prd_id", prdId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (timelineError || outputsError || scoreError) {
      throw new Error(
        timelineError?.message ?? outputsError?.message ?? scoreError?.message ?? "Status query failed",
      );
    }

    return NextResponse.json({
      prdId,
      timeline: timeline ?? [],
      outputs: outputs ?? [],
      rubric: score,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status fetch failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
