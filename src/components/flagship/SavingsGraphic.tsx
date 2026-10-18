"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export type SavingsData = {
  draft: boolean;
  pct: number;
  title: string;
  body: string;
  /** Null when only the percentage is known: bars drawn to scale, no amounts printed. */
  before: number | null;
  after: number | null;
  prefix: string;
  unit: string;
  beforeLabel: string;
  afterLabel: string;
  source: string;
  sourceUrl: string;
  asOf: string;
  note: string;
};

const TEXT = {
  en: { lower: "lower cost", saved: "saved", source: "Source", draft: "Draft: only visible outside the live site", chart: "Cost before and with Xpert" },
  bn: { lower: "কম খরচ", saved: "সাশ্রয়", source: "সূত্র", draft: "খসড়া: লাইভ সাইটে দেখা যায় না", chart: "এক্সপার্টের আগে ও পরে খরচ" },
};

/**
 * Admin → Home highlights → Cost savings: a ring that sweeps to the share
 * saved, and two bars where the "with Xpert" bar drops from the old cost to the
 * new one, the gap marked as saved. Figures come only from the admin (with
 * their source); it plays once when scrolled into view, and shows the final
 * state straight away for visitors who prefer reduced motion.
 */
export function SavingsGraphic({ data, locale }: { data: SavingsData; locale: "en" | "bn" }) {
  const t = TEXT[locale];
  const root = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      setOn(true);
      setCount(data.pct);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [data.pct]);

  // The percentage counts up with the ring.
  useEffect(() => {
    if (!on || count === data.pct) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 1600);
      const eased = 1 - Math.pow(1 - k, 3);
      setCount(Math.round(eased * data.pct));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, data.pct]);

  const nf = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 2 });
  const money = (v: number) => `${data.prefix}${nf.format(v)}${data.unit ? ` ${data.unit}` : ""}`;
  const afterShare = Math.max(4, data.before && data.after !== null ? (data.after / data.before) * 100 : 100 - data.pct);
  const R = 88;
  const C = 2 * Math.PI * R;
  const asOf = data.asOf
    ? new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${data.asOf}T00:00:00Z`))
    : "";

  return (
    <div
      ref={root}
      className={`savings relative overflow-hidden rounded-[2rem] border border-fg/10 bg-navy-900/70 p-6 md:p-10 ${on ? "is-on" : ""}`}
      style={{ "--k": afterShare / 100 } as CSSProperties}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-brand-royal/20 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-32 -bottom-40 size-96 rounded-full bg-gold/10 blur-3xl" />
      {data.draft && (
        <p className="relative mb-6 inline-flex rounded-md border border-gold/50 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">{t.draft}</p>
      )}

      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
        {/* Ring and headline */}
        <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:text-left lg:flex-col lg:items-start">
          <div className="relative size-52 shrink-0 md:size-60">
            <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden="true">
              <defs>
                <linearGradient id="savingsArc" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand-sky)" />
                  <stop offset="100%" stopColor="var(--color-gold)" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r={R} fill="none" stroke="currentColor" strokeWidth="14" className="text-fg/[0.08]" />
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                stroke="url(#savingsArc)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={on ? C * (1 - data.pct / 100) : C}
                className="savings-arc"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-6xl leading-none font-semibold text-text-primary tabular-nums md:text-7xl">
                −{nf.format(count)}
                <span className="text-3xl md:text-4xl">%</span>
              </span>
              <span className="mt-2 text-sm font-semibold text-gold">{t.lower}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-display text-3xl leading-tight font-semibold text-balance text-text-primary md:text-4xl">{data.title}</h3>
            {data.body && <p className="max-w-md leading-relaxed text-text-secondary">{data.body}</p>}
          </div>
        </div>

        {/* Before and after bars */}
        <figure className="flex flex-col gap-4" aria-label={t.chart}>
          <div className="relative grid h-72 grid-cols-2 items-end gap-6 border-b border-fg/15 px-2 md:h-80 md:gap-10 md:px-6">
            {/* The old cost, as a dashed line across both bars */}
            <span aria-hidden="true" className="absolute inset-x-0 top-10 border-t border-dashed border-fg/25" />
            <div className="relative flex h-full flex-col justify-end">
              <p className="mb-2 text-center font-mono text-sm font-semibold text-text-primary tabular-nums md:text-base">{data.before !== null ? money(data.before) : `${nf.format(100)}%`}</p>
              <div className="savings-before relative mx-auto h-[calc(100%-2.5rem)] w-full max-w-36 overflow-hidden rounded-t-2xl bg-fg/[0.12]" />
            </div>
            <div className="relative flex h-full flex-col justify-end">
              {/* The gap between the old and the new cost: what is saved */}
              <div className="savings-gap absolute inset-x-0 top-10 mx-auto flex w-full max-w-36 flex-col items-center justify-center rounded-t-2xl border border-b-0 border-dashed border-gold/50 bg-gold/[0.06]">
                <svg viewBox="0 0 24 24" className="savings-arrow size-7 text-gold" aria-hidden="true">
                  <path d="M12 4v14m0 0-6-6m6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="mt-1 font-mono text-sm font-semibold text-gold tabular-nums">
                  −{nf.format(data.pct)}% {t.saved}
                </span>
              </div>
              <div className="savings-after relative mx-auto w-full max-w-36 rounded-t-2xl bg-gradient-to-t from-brand-royal to-brand-sky shadow-[0_0_40px_-8px] shadow-brand-sky/60">
                <span aria-hidden="true" className="savings-shine absolute inset-0 rounded-t-2xl" />
                <p className="absolute -top-8 inset-x-0 text-center font-mono text-sm font-semibold text-brand-sky tabular-nums md:text-base">{data.after !== null ? money(data.after) : `${nf.format(100 - data.pct)}%`}</p>
              </div>
            </div>
          </div>
          <figcaption className="grid grid-cols-2 gap-6 px-2 text-center text-sm font-semibold text-text-secondary md:gap-10 md:px-6">
            <span>{data.beforeLabel}</span>
            <span className="text-text-primary">{data.afterLabel}</span>
          </figcaption>
          {(data.source || data.note) && (
            <p className="px-2 text-xs leading-relaxed text-text-secondary md:px-6">
              {data.note && <span>{data.note} </span>}
              {data.source && (
                <span>
                  {t.source}:{" "}
                  {data.sourceUrl ? (
                    <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-fg/30 underline-offset-2 hover:text-text-primary">
                      {data.source}
                    </a>
                  ) : (
                    data.source
                  )}
                  {asOf && ` (${asOf})`}
                </span>
              )}
            </p>
          )}
        </figure>
      </div>
    </div>
  );
}
