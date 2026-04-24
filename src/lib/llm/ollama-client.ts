import { parseJSONWithSchema } from "@/lib/parsers/json";
import { getOptionalEnv } from "@/lib/utils/env";
import { JSONGenerationOptions, LLMClient } from "./types";

const DEFAULT_MODEL = "llama3.1:8b";
const DEFAULT_BASE_URL = "http://127.0.0.1:11434";

export class OllamaClient implements LLMClient {
  public readonly provider = "ollama" as const;

  async generateJSON<T>(options: JSONGenerationOptions<T>): Promise<T> {
    const maxAttempts = options.retries ?? 2;
    const model = options.model ?? getOptionalEnv("OLLAMA_MODEL") ?? DEFAULT_MODEL;
    const baseUrl = getOptionalEnv("OLLAMA_BASE_URL") ?? DEFAULT_BASE_URL;

    for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(`${baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            stream: false,
            options: {
              temperature: options.temperature ?? 0.3,
              num_predict: options.maxTokens ?? 1400,
            },
            messages: [
              { role: "system", content: options.systemPrompt },
              { role: "user", content: options.userPrompt },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`Ollama request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as {
          message?: { content?: string };
        };

        const text = payload.message?.content ?? "";
        return parseJSONWithSchema(text, options.schema);
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error("Ollama JSON generation failed after retries.");
  }
}
