import { z } from "zod";
import { createLLMClient } from "@/lib/llm";
import { SHARED_JSON_INSTRUCTIONS } from "@/lib/llm/prompts";
import { PipelineContext } from "./types";

const stylistSchema = z.object({
  title: z.string().min(4),
  final_blog: z.string().min(80),
});

export async function runStylePolisherAgent(
  context: PipelineContext,
): Promise<PipelineContext> {
  if (!context.writer) {
    throw new Error("Style-polisher requires writer output.");
  }

  const llm = createLLMClient(context.provider);

  const systemPrompt = [
    "You are the Style-polisher Agent.",
    "Improve tone, readability, and narrative flow without introducing new facts.",
    "Preserve citations and factual grounding.",
    SHARED_JSON_INSTRUCTIONS,
  ].join(" ");

  const userPrompt = [
    `Original title: ${context.writer.title}`,
    `Draft body: ${context.writer.draft}`,
    "Return { title, final_blog }.",
  ].join("\n\n");

  const output = await llm.generateJSON({
    systemPrompt,
    userPrompt,
    schema: stylistSchema,
    temperature: 0.3,
    retries: 2,
  });

  return { ...context, stylist: output };
}
