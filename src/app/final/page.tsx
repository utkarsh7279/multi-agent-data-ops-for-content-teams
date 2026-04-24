"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { BlogRenderer } from "@/components/blog/blog-renderer";

type OutputRow = {
  stage: string;
  content: {
    title?: string;
    final_blog?: string;
  };
};

function FinalContent() {
  const params = useSearchParams();
  const prdId = params.get("prdId");

  const [title, setTitle] = useState("Final blog is not available yet");
  const [body, setBody] = useState("Run the pipeline and revisit this page with a prdId query parameter.");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!prdId) {
      return;
    }

    async function load() {
      setError(null);
      try {
        const response = await fetch(`/api/job-status?prdId=${prdId}`);
        if (!response.ok) {
          throw new Error("Failed to load final output.");
        }

        const data = (await response.json()) as { outputs: OutputRow[] };
        const stylistOutput = [...(data.outputs ?? [])]
          .reverse()
          .find((row) => row.stage === "style_polisher");

        if (!stylistOutput?.content?.final_blog) {
          setTitle("Final output pending");
          setBody("Style-polisher output has not been generated yet.");
          return;
        }

        setTitle(stylistOutput.content.title ?? "Final Blog");
        setBody(stylistOutput.content.final_blog);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Unexpected error";
        setError(message);
      }
    }

    load();
  }, [prdId]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Final Output</h2>
      <p className="text-sm text-slate-600">PRD: {prdId ?? "Missing prdId query parameter"}</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <BlogRenderer title={title} content={body} />
    </section>
  );
}

export default function FinalPage() {
  return (
    <Suspense fallback={<section className="space-y-4">Loading final output...</section>}>
      <FinalContent />
    </Suspense>
  );
}
