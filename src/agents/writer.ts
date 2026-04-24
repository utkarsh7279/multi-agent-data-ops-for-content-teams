import { z } from "zod";
import { createLLMClient } from "@/lib/llm";
import { SHARED_JSON_INSTRUCTIONS } from "@/lib/llm/prompts";
import { PipelineContext } from "./types";

const writerSchema = z.object({
  title: z.string().min(4),
  draft: z.string().min(80),
});

export async function runWriterAgent(context: PipelineContext): Promise<PipelineContext> {
  if (!context.researcher) {
    throw new Error("Writer agent requires researcher output.");
  }

  const llm = createLLMClient(context.provider);

  const systemPrompt = [
    "You are the Writer Agent.",
    "Create a polished draft grounded in provided sources.",
    "Use inline citations in the exact format [src-1].",
    SHARED_JSON_INSTRUCTIONS,
  ].join(" ");

  const userPrompt = [
    `PRD Title: ${context.title}`,
    `PRD: ${context.sourceText}`,
    `Sources JSON: ${JSON.stringify(context.researcher.sources)}`,
    "Return { title, draft }.",
  ].join("\n\n");

  const output = await llm.generateJSON({
    systemPrompt,
    userPrompt,
    schema: writerSchema,
    temperature: 0.3,
    retries: 2,
  });

  return { ...context, writer: output };
}
