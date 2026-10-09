"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { SmartLinkClient } from "./SmartLinkClient";
import type { AppLocale } from "@/lib/i18n/config";
import { digits } from "@/lib/i18n/digits";

type Node = { id: string; name: string; detail: string | null; href: string | null };

/**
 * Interactive market network: systems in sequence, connected by a line.
 * Selecting a system (click, tap or keyboard) shows what it does. Works as a
 * tab list, so it is fully usable without a mouse and without animation.
 */
export function NetworkDiagram({
  nodes,
  locale,
  hint,
  caption,
  readMore,
}: {
  nodes: Node[];
  locale: AppLocale;
  hint: string;
  caption?: string;
  readMore: string;
}) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const current = nodes[active] ?? nodes[0]!;

  function onKey(e: React.KeyboardEvent, index: number) {
    const last = nodes.length - 1;
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (index === last ? 0 : index + 1) : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (index === 0 ? last : index - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">{hint}</p>
        {caption && <Badge>{caption}</Badge>}
      </div>

      <div className="relative">
        <span aria-hidden="true" className="absolute top-1/2 right-6 left-6 hidden h-px bg-gradient-to-r from-brand-sky/10 via-brand-sky/60 to-brand-sky/10 md:block" />
        <div role="tablist" aria-orientation="horizontal" className="relative grid gap-3 md:flex md:justify-between">
          {nodes.map((n, i) => {
            const selected = i === active;
            return (
              <button
                key={n.id}
                id={`${baseId}-tab-${i}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKey(e, i)}
                className={
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors md:flex-col md:gap-2 md:px-5 md:text-center " +
                  (selected ? "border-brand-sky bg-navy-800 text-text-primary" : "border-fg/10 bg-ink-950 text-text-secondary hover:border-brand-sky/50")
                }
              >
                <span className="tabular text-xs text-brand-sky">{digits(String(i + 1).padStart(2, "0"), locale === "bn")}</span>
                <span className="font-medium">{n.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${active}`} className="glass min-h-24 rounded-3xl p-6">
        <h3 className="font-display text-xl font-semibold">{current.name}</h3>
        {current.detail && <p className="mt-2 max-w-3xl whitespace-pre-line text-text-secondary">{current.detail}</p>}
        {current.href && (
          <SmartLinkClient href={current.href} locale={locale} className="mt-4 inline-block text-sm text-brand-sky hover:underline">
            {readMore}
          </SmartLinkClient>
        )}
      </div>
    </div>
  );
}
