import { describe, expect, it } from "vitest";
import { extractJSONObject, parseJSONWithSchema } from "@/lib/parsers/json";
import { z } from "zod";

describe("json parser", () => {
  it("extracts raw json from fenced block", () => {
    const input = "```json\n{\"a\":1}\n```";
    expect(extractJSONObject(input)).toBe('{"a":1}');
  });

  it("parses and validates json with schema", () => {
    const schema = z.object({ title: z.string() });
    const output = parseJSONWithSchema('{"title":"hello"}', schema);
    expect(output.title).toBe("hello");
  });
});
