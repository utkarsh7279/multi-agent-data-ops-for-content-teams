import OpenAI from "openai";
import { parseJSONWithSchema } from "@/lib/parsers/json";
import { getRequiredEnv } from "@/lib/utils/env";
import { JSONGenerationOptions, LLMClient } from "./types";

const DEFAULT_MODEL = "gpt-4.1-mini";

export class OpenAIClient implements LLMClient {
  public readonly provider = "openai" as const;
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: getRequiredEnv("OPENAI_API_KEY") });
  }

  async generateJSON<T>(options: JSONGenerationOptions<T>): Promise<T> {
    const maxAttempts = options.retries ?? 2;
    const model = options.model ?? DEFAULT_MODEL;

    for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
      try {
        const completion = await this.client.chat.completions.create({
          model,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens ?? 1400,
          messages: [
            { role: "system", content: options.systemPrompt },
            { role: "user", content: options.userPrompt },
          ],
        });

        const text = completion.choices[0]?.message?.content ?? "";
        return parseJSONWithSchema(text, options.schema);
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error("OpenAI JSON generation failed after retries.");
  }
}
