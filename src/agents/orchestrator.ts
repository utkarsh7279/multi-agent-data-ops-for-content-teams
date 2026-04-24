import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  runFactCheckerAgent,
  runResearcherAgent,
  runStylePolisherAgent,
  runWriterAgent,
} from "@/agents";
import {
  completeStageJob,
  createStageJob,
  logAuditEvent,
  storeSources,
  storeStageOutput,
} from "@/lib/logging/pipeline-logger";
import { executeFactCheckRollback } from "@/lib/rollback/factcheck-rollback";
import { computeRubricScore, persistRubricScore } from "@/lib/scoring/rubric";
import { PipelineContext } from "./types";

const PipelineGraphState = Annotation.Root({
  context: Annotation<PipelineContext>,
  strictRetryEnabled: Annotation<boolean>,
  factCheckFailed: Annotation<boolean>,
  rollbackReason: Annotation<string | null>,
});

type PipelineGraphStateType = typeof PipelineGraphState.State;

async function withStage<T>(
  prdId: string,
  stage: "researcher" | "writer" | "fact_checker" | "style_polisher",
  handler: (jobId: string) => Promise<T>,
): Promise<T> {
  const jobId = await createStageJob(prdId, stage);
  try {
    const result = await handler(jobId);
    await completeStageJob(jobId, "succeeded");
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown stage failure";
    await completeStageJob(jobId, "failed", message);
    throw error;
  }
}

const researcherNode = async (
  state: PipelineGraphStateType,
): Promise<Partial<PipelineGraphStateType>> => {
  const updated = await withStage(state.context.prdId, "researcher", async (jobId) => {
    const next = await runResearcherAgent(state.context);
    if (!next.researcher) {
      throw new Error("Researcher output missing.");
    }

    await storeSources(next.prdId, next.researcher.sources);
    await storeStageOutput(next.prdId, "researcher", next.researcher, {
      provider: next.provider,
    }, jobId);

    return next;
  });

  await logAuditEvent(updated.prdId, "stage_completed", { stage: "researcher" });
  return { context: updated };
};

const writerNode = async (
  state: PipelineGraphStateType,
): Promise<Partial<PipelineGraphStateType>> => {
  const updated = await withStage(state.context.prdId, "writer", async (jobId) => {
    const next = await runWriterAgent(state.context);
    if (!next.writer) {
      throw new Error("Writer output missing.");
    }

    await storeStageOutput(next.prdId, "writer", next.writer, {
      provider: next.provider,
    }, jobId);

    return next;
  });

  await logAuditEvent(updated.prdId, "stage_completed", { stage: "writer" });
  return { context: updated };
};

const factCheckerNode = async (
  state: PipelineGraphStateType,
): Promise<Partial<PipelineGraphStateType>> => {
  let updated = await withStage(state.context.prdId, "fact_checker", async (jobId) => {
    const next = await runFactCheckerAgent(state.context, { strict: false });
    if (!next.factChecker) {
      throw new Error("Fact-checker output missing.");
    }

    await storeStageOutput(next.prdId, "fact_checker", next.factChecker, {
      provider: next.provider,
      strict_mode: false,
    }, jobId);

    return next;
  });

  if (updated.factChecker?.failed && state.strictRetryEnabled) {
    updated = await withStage(updated.prdId, "fact_checker", async (jobId) => {
      const strictAttempt = await runFactCheckerAgent(updated, { strict: true });
      if (!strictAttempt.factChecker) {
        throw new Error("Strict fact-checker output missing.");
      }

      await storeStageOutput(strictAttempt.prdId, "fact_checker", strictAttempt.factChecker, {
        provider: strictAttempt.provider,
        strict_mode: true,
      }, jobId);

      return strictAttempt;
    });

    await logAuditEvent(updated.prdId, "factcheck_strict_retry", {
      failed: updated.factChecker?.failed ?? true,
    });
  }

  const failed = updated.factChecker?.failed ?? true;
  return {
    context: updated,
    factCheckFailed: failed,
    rollbackReason: failed ? (updated.factChecker?.summary ?? "Fact-check failed") : null,
  };
};

const stylistNode = async (
  state: PipelineGraphStateType,
): Promise<Partial<PipelineGraphStateType>> => {
  const updated = await withStage(state.context.prdId, "style_polisher", async (jobId) => {
    const next = await runStylePolisherAgent(state.context);
    if (!next.stylist || !next.writer || !next.factChecker) {
      throw new Error("Stylist dependencies missing.");
    }

    await storeStageOutput(next.prdId, "style_polisher", next.stylist, {
      provider: next.provider,
    }, jobId);

    const rubric = computeRubricScore({
      prdId: next.prdId,
      factFailed: next.factChecker.failed,
      draftLength: next.writer.draft.length,
      finalLength: next.stylist.final_blog.length,
    });

    await persistRubricScore(next.prdId, rubric.score, rubric.criteria);
    await logAuditEvent(next.prdId, "rubric_scored", {
      score: rubric.score,
      criteria: rubric.criteria,
    });

    return next;
  });

  await logAuditEvent(updated.prdId, "stage_completed", { stage: "style_polisher" });
  return { context: updated };
};

const rollbackNode = async (
  state: PipelineGraphStateType,
): Promise<Partial<PipelineGraphStateType>> => {
  await executeFactCheckRollback(state.context.prdId, state.rollbackReason ?? "Unknown rollback reason");
  return state;
};

function shouldRollback(state: PipelineGraphStateType) {
  return state.factCheckFailed ? "rollback" : "stylist";
}

function buildPipelineGraph() {
  return new StateGraph(PipelineGraphState)
    .addNode("researcher", researcherNode)
    .addNode("writer", writerNode)
    .addNode("fact_checker", factCheckerNode)
    .addNode("stylist", stylistNode)
    .addNode("rollback", rollbackNode)
    .addEdge(START, "researcher")
    .addEdge("researcher", "writer")
    .addEdge("writer", "fact_checker")
    .addConditionalEdges("fact_checker", shouldRollback, {
      stylist: "stylist",
      rollback: "rollback",
    })
    .addEdge("stylist", END)
    .addEdge("rollback", END)
    .compile();
}

export async function runPipelineOrchestrator(input: {
  prdId: string;
  title: string;
  sourceText: string;
  provider: "ollama" | "openai" | "anthropic";
  strictRetryEnabled?: boolean;
}) {
  await logAuditEvent(input.prdId, "pipeline_started", {
    provider: input.provider,
    strict_retry_enabled: input.strictRetryEnabled ?? true,
  });

  const graph = buildPipelineGraph();

  const result = await graph.invoke({
    context: {
      prdId: input.prdId,
      title: input.title,
      sourceText: input.sourceText,
      provider: input.provider,
    },
    strictRetryEnabled: input.strictRetryEnabled ?? true,
    factCheckFailed: false,
    rollbackReason: null,
  });

  await logAuditEvent(input.prdId, "pipeline_finished", {
    rollback_triggered: result.factCheckFailed,
    rollback_reason: result.rollbackReason,
  });

  return result;
}
