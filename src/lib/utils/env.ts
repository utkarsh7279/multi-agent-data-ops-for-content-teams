type RequiredEnvKey =
  | "OPENAI_API_KEY"
  | "ANTHROPIC_API_KEY"
  | "SUPABASE_URL"
  | "SUPABASE_SERVICE_KEY";

type OptionalEnvKey =
  | "SERPAPI_API_KEY"
  | "CRON_SECRET"
  | "OLLAMA_BASE_URL"
  | "OLLAMA_MODEL";

export function getRequiredEnv(key: RequiredEnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getOptionalEnv(key: OptionalEnvKey): string | undefined {
  const value = process.env[key];
  return value?.trim() ? value : undefined;
}
