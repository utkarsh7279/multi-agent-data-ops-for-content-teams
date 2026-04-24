type BlogRendererProps = {
  title: string;
  content: string;
};

export function BlogRenderer({ title, content }: BlogRendererProps) {
  const paragraphs = content.split("\n").filter(Boolean);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-8">
      <h2 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <div className="space-y-4 text-base leading-7 text-slate-700">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
