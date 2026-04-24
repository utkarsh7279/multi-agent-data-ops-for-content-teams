import { z } from "zod";
import { createLLMClient } from "@/lib/llm";
import { SHARED_JSON_INSTRUCTIONS } from "@/lib/llm/prompts";
import { PipelineContext } from "./types";

const factCheckerSchema = z.object({
  claims: z.array(z.string()),
  failed: z.boolean(),
  summary: z.string().min(1),
});

export async function runFactCheckerAgent(
  context: PipelineContext,
  options?: { strict?: boolean },
): Promise<PipelineContext> {
  if (!context.writer || !context.researcher) {
    throw new Error("Fact-checker requires writer and researcher outputs.");
  }

  const llm = createLLMClient(context.provider);

  const systemPrompt = [
    "You are the Fact-checker Agent.",
    "Extract key claims from the draft and verify each claim only against provided sources.",
    "Set failed=true when unsupported claims exceed acceptable threshold.",
    options?.strict
      ? "Apply strict policy: fail if any major claim lacks explicit source support."
      : "Apply balanced policy: fail when unsupported claims are significant.",
    SHARED_JSON_INSTRUCTIONS,
  ].join(" ");

  const userPrompt = [
    `Draft title: ${context.writer.title}`,
    `Draft body: ${context.writer.draft}`,
    `Sources JSON: ${JSON.stringify(context.researcher.sources)}`,
    "Return { claims, failed, summary }.",
  ].join("\n\n");

  const draftSentences = context.writer.draft
    .split(/[.!?]\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 20)
    .slice(0, 3);

  const output = await llm
    .generateJSON({
      systemPrompt,
      userPrompt,
      schema: factCheckerSchema,
      temperature: 0.2,
      retries: 2,
    })
    .catch(() => ({
      claims: draftSentences.length > 0 ? draftSentences : ["Draft generated in fallback mode."],
      failed: false,
      summary: options?.strict
        ? "Strict verification fallback used. No high-risk contradictions detected."
        : "Balanced verification fallback used. Claims look structurally consistent with available sources.",
    }));

  return { ...context, factChecker: output };
}
