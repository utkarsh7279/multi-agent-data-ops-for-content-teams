import {
  FactCheckerOutput,
  ResearcherOutput,
  StylistOutput,
  WriterOutput,
} from "@/lib/types/pipeline";
import { LLMProvider } from "@/lib/llm/types";

export type PipelineContext = {
  prdId: string;
  title: string;
  sourceText: string;
  provider: LLMProvider;
  researcher?: ResearcherOutput;
  writer?: WriterOutput;
  factChecker?: FactCheckerOutput;
  stylist?: StylistOutput;
};
