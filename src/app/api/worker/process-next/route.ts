import { NextResponse } from "next/server";
import { processNextQueuedPipelineJob } from "@/lib/pipeline/job-worker";
import { getOptionalEnv } from "@/lib/utils/env";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = getOptionalEnv("CRON_SECRET");
  if (!secret) {
    return true;
  }

  const provided = request.headers.get("x-cron-secret");
  return provided === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processNextQueuedPipelineJob();
  return NextResponse.json(result, { status: 200 });
}
