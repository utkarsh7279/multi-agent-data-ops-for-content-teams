import { z } from "zod";
import { createLLMClient } from "@/lib/llm";
import { SHARED_JSON_INSTRUCTIONS } from "@/lib/llm/prompts";
import { runSearchQueries } from "@/lib/search/serpapi";
import { PipelineContext } from "./types";

const querySchema = z.object({
  search_queries: z.array(z.string().min(2)).min(1),
});

export async function runResearcherAgent(
  context: PipelineContext,
): Promise<PipelineContext> {
  const llm = createLLMClient(context.provider);

  const systemPrompt = [
    "You are the Researcher Agent in a content production pipeline.",
    "Generate focused web search queries for evidence collection.",
    SHARED_JSON_INSTRUCTIONS,
  ].join(" ");

  const userPrompt = `PRD Title: ${context.title}\nPRD:\n${context.sourceText}\n\nReturn { search_queries }.`;

  const queryOutput = await llm.generateJSON({
    systemPrompt,
    userPrompt,
    schema: querySchema,
    temperature: 0.2,
    retries: 2,
  });

  const sources = await runSearchQueries(queryOutput.search_queries);

  const output = {
    search_queries: queryOutput.search_queries,
    sources,
  };

  return { ...context, researcher: output };
}
