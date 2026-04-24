import { logAuditEvent } from "@/lib/logging/pipeline-logger";

export async function executeFactCheckRollback(prdId: string, summary: string) {
  await logAuditEvent(prdId, "pipeline_rollback", {
    reason: "fact_check_failed",
    summary,
    created_at: new Date().toISOString(),
  });
}
