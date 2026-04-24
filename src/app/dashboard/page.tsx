"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { MetricsCards } from "@/components/metrics/metrics-cards";

type TimelineRow = {
  stage: string;
  started_at: string | null;
  completed_at: string | null;
};

type Rubric = {
  score: number;
  criteria_json: {
    fact_failed?: boolean;
  };
};

function DashboardContent() {
  const params = useSearchParams();
  const prdId = params.get("prdId");

  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [stageLatencies, setStageLatencies] = useState<Array<{ stage: string; latencyMs: number }>>([]);
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
          throw new Error("Failed to load dashboard.");
        }

        const data = (await response.json()) as {
          timeline: TimelineRow[];
          rubric: Rubric | null;
        };

        const latencies = (data.timeline ?? []).map((row) => ({
          stage: row.stage,
          latencyMs:
            row.started_at && row.completed_at
              ? Math.max(0, new Date(row.completed_at).getTime() - new Date(row.started_at).getTime())
              : 0,
        }));

        setStageLatencies(latencies);
        setScore(data.rubric?.score ?? 0);
        setPassed(!data.rubric?.criteria_json?.fact_failed);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Unexpected error";
        setError(message);
      }
    }

    load();
  }, [prdId]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Metrics Dashboard</h2>
      <p className="text-sm text-slate-600">PRD: {prdId ?? "Missing prdId query parameter"}</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <MetricsCards score={score} passed={passed} stageLatencies={stageLatencies} />
    </section>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<section className="space-y-4">Loading dashboard...</section>}>
      <DashboardContent />
    </Suspense>
  );
}
