"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { PipelineTimeline } from "@/components/timeline/pipeline-timeline";
import { PipelineTimelineItem } from "@/lib/types/pipeline";

type TimelineRow = {
  stage: PipelineTimelineItem["stage"];
  status: PipelineTimelineItem["status"];
  started_at: string | null;
  completed_at: string | null;
};

function TimelineContent() {
  const params = useSearchParams();
  const prdId = params.get("prdId");

  const [items, setItems] = useState<PipelineTimelineItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!prdId) {
      return;
    }

    let isMounted = true;

    async function loadStatus() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/job-status?prdId=${prdId}`);
        if (!response.ok) {
          throw new Error("Failed to load timeline.");
        }

        const data = (await response.json()) as { timeline: TimelineRow[] };

        if (!isMounted) {
          return;
        }

        const mapped = data.timeline.map((row) => {
          const latency =
            row.started_at && row.completed_at
              ? new Date(row.completed_at).getTime() - new Date(row.started_at).getTime()
              : undefined;

          return {
            stage: row.stage,
            status: row.status,
            started_at: row.started_at,
            completed_at: row.completed_at,
            latency_ms: latency,
          };
        });

        setItems(mapped);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Unexpected error";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadStatus();
    const interval = setInterval(loadStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [prdId]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Pipeline Timeline</h2>
      <p className="text-sm text-slate-600">
        PRD: {prdId ?? "Missing prdId query parameter"}
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {isLoading ? <p className="text-sm text-slate-500">Refreshing status...</p> : null}
      <PipelineTimeline items={items} />
    </section>
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={<section className="space-y-4">Loading timeline...</section>}>
      <TimelineContent />
    </Suspense>
  );
}
