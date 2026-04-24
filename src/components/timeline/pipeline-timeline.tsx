import { PipelineTimelineItem } from "@/lib/types/pipeline";

type PipelineTimelineProps = {
  items: PipelineTimelineItem[];
};

export function PipelineTimeline({ items }: PipelineTimelineProps) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      {items.map((item) => (
        <div
          key={`${item.stage}-${item.started_at ?? "pending"}`}
          className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-none last:pb-0"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">{item.stage}</p>
            <p className="text-xs text-slate-500">Status: {item.status}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Start: {item.started_at ?? "-"}</p>
            <p>End: {item.completed_at ?? "-"}</p>
            <p>Latency: {item.latency_ms ? `${item.latency_ms} ms` : "-"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
