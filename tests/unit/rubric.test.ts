import { describe, expect, it } from "vitest";
import { computeRubricScore } from "@/lib/scoring/rubric";

describe("rubric scoring", () => {
  it("penalizes accuracy when fact check fails", () => {
    const output = computeRubricScore({
      prdId: "11111111-1111-1111-1111-111111111111",
      factFailed: true,
      draftLength: 800,
      finalLength: 1000,
    });

    expect(output.criteria.accuracy).toBe(40);
    expect(output.score).toBeLessThan(80);
  });

  it("rewards passing fact checks", () => {
    const output = computeRubricScore({
      prdId: "11111111-1111-1111-1111-111111111111",
      factFailed: false,
      draftLength: 800,
      finalLength: 1000,
    });

    expect(output.criteria.accuracy).toBe(92);
    expect(output.score).toBeGreaterThan(80);
  });
});
