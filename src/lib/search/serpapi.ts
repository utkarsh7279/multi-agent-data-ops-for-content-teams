import { getOptionalEnv } from "@/lib/utils/env";
import { SearchClient, SearchResult, normalizeSources } from "./types";

class SerpApiClient implements SearchClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      num: "4",
      api_key: this.apiKey,
      engine: "google",
    });

    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`SerpAPI request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      organic_results?: Array<{
        link?: string;
        title?: string;
        snippet?: string;
      }>;
    };

    return (payload.organic_results ?? [])
      .filter((item) => item.link && item.title && item.snippet)
      .map((item) => ({
        url: item.link as string,
        title: item.title as string,
        snippet: item.snippet as string,
      }));
  }
}

function mockSearch(query: string): SearchResult[] {
  return [
    {
      url: `https://example.com/research/${encodeURIComponent(query)}`,
      title: `Mock evidence for ${query}`,
      snippet: `Mock source snippet for query: ${query}`,
    },
    {
      url: `https://example.org/insights/${encodeURIComponent(query)}`,
      title: `Industry insight on ${query}`,
      snippet: `Synthetic insight used when SERPAPI_API_KEY is not configured.`,
    },
  ];
}

export async function runSearchQueries(queries: string[]) {
  const apiKey = getOptionalEnv("SERPAPI_API_KEY");

  if (!apiKey) {
    const mocked = queries.flatMap((query) => mockSearch(query));
    return normalizeSources(mocked);
  }

  const client = new SerpApiClient(apiKey);
  const allResults: SearchResult[] = [];

  for (const query of queries) {
    try {
      const results = await client.search(query);
      allResults.push(...results);
    } catch {
      allResults.push(...mockSearch(query));
    }
  }

  return normalizeSources(allResults);
}
