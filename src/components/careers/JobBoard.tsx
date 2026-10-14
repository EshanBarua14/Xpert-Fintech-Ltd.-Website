"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

export type JobRowData = {
  id: string;
  href: string;
  title: string;
  summary: string | null;
  dept: string | null;
  type: string;
  location: string | null;
  open: boolean;
  deadline: string | null;
  apply: { kind: "linkedin" | "bdjobs" | "email"; href: string; label: string }[];
};

export type JobBoardLabels = { all: string; closed: string; view: string; viewAndApply: string; filter: string; showing: string };

/**
 * Open roles with department filters (each with its count) and, on every
 * row, the ways to apply (LinkedIn, Bdjobs, email) next to the link to the
 * full job. Filtering happens in place; the list animates as it changes.
 */
export function JobBoard({ jobs, labels, locale }: { jobs: JobRowData[]; labels: JobBoardLabels; locale: "en" | "bn" }) {
  const [dept, setDept] = useState<string | null>(null);
  const nf = (v: number) => new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(v);
  const depts = useMemo(() => {
    const m = new Map<string, number>();
    for (const j of jobs) if (j.dept) m.set(j.dept, (m.get(j.dept) ?? 0) + 1);
    return [...m.entries()];
  }, [jobs]);
  const shown = dept ? jobs.filter((j) => j.dept === dept) : jobs;

  return (
    <div className="flex flex-col gap-6">
      {depts.length > 1 && (
        <div className="flex flex-col gap-3">
          <ul aria-label={labels.filter} className="flex flex-wrap gap-2">
            {[[null, jobs.length] as const, ...depts].map(([d, n]) => {
              const on = dept === d;
              return (
                <li key={d ?? "all"}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDept(d)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                      on ? "border-brand-sky bg-brand-sky/15 text-text-primary" : "border-fg/10 text-text-secondary hover:border-brand-sky/50 hover:text-text-primary",
                    )}
                  >
                    {d ?? labels.all}
                    <span className={cn("rounded-full px-1.5 text-xs tabular-nums", on ? "bg-brand-sky/25" : "bg-fg/[0.06]")}>{nf(n)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p aria-live="polite" className="text-xs text-text-secondary">
            {labels.showing.replace("{n}", nf(shown.length)).replace("{total}", nf(jobs.length))}
          </p>
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {shown.map((j, i) => (
          <li key={j.id} className="cx-panel" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` } as CSSProperties}>
            <div className="spotlight glass group relative grid gap-4 rounded-3xl p-6 transition-transform duration-500 hover:-translate-y-0.5 md:grid-cols-[1fr_auto] md:items-center md:p-7">
              <span className="flex flex-col gap-2">
                <span className="flex flex-wrap items-center gap-2 text-xs">
                  {j.dept && <span className="rounded-full bg-brand-sky/10 px-2.5 py-1 font-semibold text-cyan-300">{j.dept}</span>}
                  <span className="rounded-full border border-fg/10 px-2.5 py-1 text-text-secondary">{j.type}</span>
                  {j.location && <span className="rounded-full border border-fg/10 px-2.5 py-1 text-text-secondary">{j.location}</span>}
                  {!j.open && <span className="rounded-full border border-gold/40 px-2.5 py-1 text-gold">{labels.closed}</span>}
                  {j.open && j.deadline && <span className="text-text-secondary">{j.deadline}</span>}
                </span>
                <Link href={j.href} className="font-display text-xl font-semibold tracking-tight text-text-primary after:absolute after:inset-0 after:rounded-3xl after:content-[''] md:text-2xl">
                  {j.title}
                </Link>
                {j.summary && <span className="line-clamp-2 text-sm text-text-secondary">{j.summary}</span>}
                {j.open && j.apply.length > 0 && (
                  <span className="relative z-10 mt-1 flex flex-wrap gap-1.5">
                    {j.apply.map((a) => (
                      <a
                        key={a.kind}
                        href={a.href}
                        {...(a.kind !== "email" && { target: "_blank", rel: "noopener noreferrer" })}
                        className="inline-flex h-8 items-center rounded-full border border-fg/15 px-3 text-xs font-semibold text-brand-sky transition-colors hover:border-brand-sky/60 hover:text-fg"
                      >
                        {a.label}
                        {a.kind !== "email" && <span aria-hidden="true" className="ml-1">↗</span>}
                      </a>
                    ))}
                  </span>
                )}
              </span>
              <span aria-hidden="true" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-sky">
                {j.open ? labels.viewAndApply : labels.view}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
