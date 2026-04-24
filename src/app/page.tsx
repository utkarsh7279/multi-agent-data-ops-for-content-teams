import Link from "next/link";
import { PRDSubmitForm } from "@/components/forms/prd-submit-form";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          PRD to Blog Pipeline
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Submit a Product Requirements Document to run the agent sequence:
          Researcher, Writer, Fact-checker, and Style-polisher.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/timeline"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View Timeline
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Open Metrics Dashboard
          </Link>
        </div>
      </section>
      <PRDSubmitForm />
    </div>
  );
}
