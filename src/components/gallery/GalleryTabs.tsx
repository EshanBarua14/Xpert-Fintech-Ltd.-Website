"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type GalleryTab = { id: string; label: string; count: string; content: ReactNode };

/**
 * All / Photos / Videos. Every panel is in the page (so it works without
 * JavaScript and for search engines); the tabs show one at a time. The
 * address's #photos or #videos opens that tab, so old links keep working.
 */
export function GalleryTabs({ tabs, label }: { tabs: GalleryTab[]; label: string }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const [ready, setReady] = useState(false);
  const base = useId();
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === h)) setActive(h);
    };
    fromHash();
    setReady(true);
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  const select = (id: string) => {
    setActive(id);
    history.replaceState(null, "", id === tabs[0]?.id ? window.location.pathname : `#${id}`);
  };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]!;
    select(next.id);
    document.getElementById(`${base}-tab-${next.id}`)?.focus();
  };

  return (
    <div className="flex flex-col gap-8">
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
        {tabs.map((t, i) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              id={`${base}-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => select(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "flex items-center gap-2.5 rounded-full border py-2 pr-5 pl-2 text-sm font-semibold transition-colors",
                on ? "border-brand-sky/60 bg-brand-sky/10 text-text-primary" : "border-fg/10 text-text-secondary hover:border-fg/25 hover:text-text-primary",
              )}
            >
              <span className={cn("flex h-8 min-w-8 items-center justify-center rounded-full px-2 font-mono text-xs", on ? "bg-brand-sky/20 text-accent" : "bg-fg/[0.06]")}>{t.count}</span>
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`${base}-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${t.id}`}
          // Before the script runs, "All" (which holds everything) shows.
          hidden={ready ? t.id !== active : t.id !== tabs[0]?.id}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
