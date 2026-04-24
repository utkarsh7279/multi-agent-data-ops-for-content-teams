import { SourceRecord } from "@/lib/types/pipeline";

export type SearchResult = {
  url: string;
  title: string;
  snippet: string;
};

export type SearchClient = {
  search(query: string): Promise<SearchResult[]>;
};

export function normalizeSources(results: SearchResult[]): SourceRecord[] {
  const deduped = new Map<string, SearchResult>();
  for (const result of results) {
    if (!deduped.has(result.url)) {
      deduped.set(result.url, result);
    }
  }

  return [...deduped.values()].slice(0, 8).map((item, index) => ({
    id: `src-${index + 1}`,
    url: item.url,
    title: item.title,
    snippet: item.snippet,
  }));
}
