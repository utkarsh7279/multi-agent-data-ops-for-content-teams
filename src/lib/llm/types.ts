import { z } from "zod";

export type LLMProvider = "ollama" | "openai" | "anthropic";

export type JSONGenerationOptions<T> = {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  retries?: number;
};

export interface LLMClient {
  provider: LLMProvider;
  generateJSON<T>(options: JSONGenerationOptions<T>): Promise<T>;
}
