type MetricsCardsProps = {
  score: number;
  passed: boolean;
  stageLatencies: Array<{ stage: string; latencyMs: number }>;
};

export function MetricsCards({ score, passed, stageLatencies }: MetricsCardsProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Rubric Score</p>
          <p className="text-3xl font-semibold text-slate-900">{score.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Fact-check Status</p>
          <p className="text-3xl font-semibold text-slate-900">
            {passed ? "Pass" : "Fail"}
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-3 text-sm text-slate-500">Stage Latency</p>
        <div className="space-y-2">
          {stageLatencies.map((entry) => (
            <div key={entry.stage} className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{entry.stage}</span>
              <span className="text-slate-500">{entry.latencyMs} ms</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
