import { createSupabaseAdminClient } from "@/lib/supabase/client";

type RubricInput = {
  prdId: string;
  factFailed: boolean;
  draftLength: number;
  finalLength: number;
};

export function computeRubricScore(input: RubricInput) {
  const clarity = Math.min(100, 60 + Math.floor(input.finalLength / 40));
  const tone = Math.min(100, 65 + Math.floor(input.finalLength / 60));
  const accuracy = input.factFailed ? 40 : 92;

  const score = Number(((clarity + tone + accuracy) / 3).toFixed(2));

  return {
    score,
    criteria: {
      clarity,
      tone,
      accuracy,
      draft_length: input.draftLength,
      final_length: input.finalLength,
      fact_failed: input.factFailed,
    },
  };
}

export async function persistRubricScore(
  prdId: string,
  score: number,
  criteria: Record<string, unknown>,
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("rubric_scores").insert({
    prd_id: prdId,
    score,
    criteria_json: criteria,
  });

  if (error) {
    throw new Error(`Failed to persist rubric score: ${error.message}`);
  }
}
