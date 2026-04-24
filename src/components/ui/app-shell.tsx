import Link from "next/link";
import { PropsWithChildren } from "react";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/timeline", label: "Timeline" },
  { href: "/final", label: "Final Output" },
  { href: "/dashboard", label: "Metrics" },
];

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] text-slate-500">
              MULTI-AGENT DATA OPS
            </p>
            <h1 className="text-lg font-semibold">Content Pipeline Console</h1>
          </div>
          <nav className="flex items-center gap-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
