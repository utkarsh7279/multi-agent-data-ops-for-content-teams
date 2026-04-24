import { describe, expect, it } from "vitest";
import { runSearchQueries } from "@/lib/search/serpapi";

describe("search fallback", () => {
  it("returns normalized mock sources when SerpAPI key is absent", async () => {
    const output = await runSearchQueries([
      "content workflow quality",
      "fact checking pipeline",
    ]);

    expect(output.length).toBeGreaterThan(0);
    expect(output[0]?.id).toBe("src-1");
    expect(output[0]?.url.startsWith("http")).toBe(true);
  });
});
