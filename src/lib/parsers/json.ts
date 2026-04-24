import { z } from "zod";

const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;

export function extractJSONObject(input: string): string {
  const trimmed = input.trim();
  const blockMatch = trimmed.match(jsonBlockRegex);
  if (blockMatch?.[1]) {
    return blockMatch[1].trim();
  }
  return trimmed;
}

export function parseJSONWithSchema<T>(
  rawText: string,
  schema: z.ZodType<T>,
): T {
  const normalized = extractJSONObject(rawText);
  const parsed = JSON.parse(normalized);
  return schema.parse(parsed);
}
