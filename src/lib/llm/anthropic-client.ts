import Anthropic from "@anthropic-ai/sdk";
import { parseJSONWithSchema } from "@/lib/parsers/json";
import { getRequiredEnv } from "@/lib/utils/env";
import { JSONGenerationOptions, LLMClient } from "./types";

const DEFAULT_MODEL = "claude-3-5-sonnet-latest";

export class AnthropicClient implements LLMClient {
  public readonly provider = "anthropic" as const;
  private readonly client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: getRequiredEnv("ANTHROPIC_API_KEY") });
  }

  async generateJSON<T>(options: JSONGenerationOptions<T>): Promise<T> {
    const maxAttempts = options.retries ?? 2;
    const model = options.model ?? DEFAULT_MODEL;

    for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await this.client.messages.create({
          model,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens ?? 1400,
          system: options.systemPrompt,
          messages: [{ role: "user", content: options.userPrompt }],
        });

        const block = response.content.find((item) => item.type === "text");
        const text = block?.type === "text" ? block.text : "";
        return parseJSONWithSchema(text, options.schema);
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error("Anthropic JSON generation failed after retries.");
  }
}
