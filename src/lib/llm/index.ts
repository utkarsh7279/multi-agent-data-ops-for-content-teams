import { AnthropicClient } from "./anthropic-client";
import { OllamaClient } from "./ollama-client";
import { OpenAIClient } from "./openai-client";
import { LLMClient, LLMProvider } from "./types";

export function createLLMClient(provider: LLMProvider): LLMClient {
  if (provider === "ollama") {
    return new OllamaClient();
  }
  if (provider === "openai") {
    return new OpenAIClient();
  }
  return new AnthropicClient();
}
