"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PRDSubmitFormProps = {
  onSubmitted?: (prdId: string) => void;
};

export function PRDSubmitForm({ onSubmitted }: PRDSubmitFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [provider, setProvider] = useState<"ollama" | "openai" | "anthropic">("ollama");
  const [executeNow, setExecuteNow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/submit-prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sourceText }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit PRD.");
      }

      const data = (await response.json()) as { prdId: string; jobId: string };

      const runResponse = await fetch("/api/run-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prdId: data.prdId,
          provider,
          strictRetryEnabled: true,
          executeNow,
        }),
      });

      if (!runResponse.ok) {
        throw new Error("PRD was created, but pipeline execution failed.");
      }

      onSubmitted?.(data.prdId);
      setTitle("");
      setSourceText("");
      router.push(`/timeline?prdId=${data.prdId}`);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unexpected error";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
    >
      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-700">
          PRD Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="AI launch campaign PRD"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-500"
        />
      </div>
      <div>
        <label
          htmlFor="sourceText"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          PRD Source Text
        </label>
        <textarea
          id="sourceText"
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          rows={10}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-500"
          placeholder="Paste your Product Requirements Document here..."
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          LLM Provider
        </label>
        <select
          value={provider}
          onChange={(event) =>
            setProvider(event.target.value as "ollama" | "openai" | "anthropic")
          }
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="ollama">Ollama (Free Local)</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={executeNow}
          onChange={(event) => setExecuteNow(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Run immediately in request (local debug)
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Submitting and Queueing Pipeline..." : "Submit PRD"}
      </button>
    </form>
  );
}
