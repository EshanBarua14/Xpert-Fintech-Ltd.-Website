"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export type SavingsData = {
  draft: boolean;
  pct: number;
  title: string;
  body: string;
  /** Null when only the percentage is known: drawn to scale, no amounts printed. */
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
  en: {
    lower: "lower cost",
    saved: "saved",
    pay: "What you pay",
    save: "What you save",
    each: "Each block is 5% of the cost",
    source: "Source",
    draft: "Draft: only visible outside the live site",
    chart: "Cost before and with Xpert",
  },
  bn: {
    lower: "কম খরচ",
    saved: "সাশ্রয়",
    pay: "যা খরচ হয়",
    save: "যা সাশ্রয় হয়",
    each: "প্রতিটি ঘর খরচের ৫%",
    source: "সূত্র",
    draft: "খসড়া: লাইভ সাইটে দেখা যায় না",
    chart: "এক্সপার্টের আগে ও পরে খরচ",
  },
};

/** The cost drawn as 20 blocks of 5% each. */
const BLOCKS = 20;

/**
 * Admin → Home highlights → Cost savings. The cost is drawn as twenty blocks:
 * the "before" row stays full, while in the "with Xpert" row the blocks that
 * are no longer paid for lift away one by one and turn into gold outlines,
 * leaving only what is still paid. The headline percentage counts up in step.
 * Figures come only from the admin, with their source. It plays once when
 * scrolled into view; visitors who prefer reduced motion see the final state.
 */
export function SavingsGraphic({ data, locale }: { data: SavingsData; locale: "en" | "bn" }) {
  const t = TEXT[locale];
  const root = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [count, setCount] = useState(0);
  const kept = Math.max(1, Math.min(BLOCKS - 1, Math.round(((100 - data.pct) / 100) * BLOCKS)));
  const savedBlocks = BLOCKS - kept;

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
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [data.pct]);

  // The percentage counts up while the blocks lift away (same start and length).
  useEffect(() => {
    if (!on || count === data.pct) return;
    let raf = 0;
    const delay = 700;
    const length = 600 + savedBlocks * 70;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const k = Math.max(0, Math.min(1, (now - start) / length));
      setCount(Math.round((1 - Math.pow(1 - k, 2)) * data.pct));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, data.pct]);

  const nf = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 2 });
  const amount = (v: number | null, share: number) => (v !== null ? `${data.prefix}${nf.format(v)}${data.unit ? ` ${data.unit}` : ""}` : `${nf.format(share)}%`);
  const asOf = data.asOf
    ? new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${data.asOf}T00:00:00Z`))
    : "";

  return (
    <div ref={root} className={`sv relative overflow-hidden rounded-[2rem] border border-fg/10 bg-navy-900/70 p-6 md:p-10 lg:p-12 ${on ? "is-on" : ""}`}>
      <span aria-hidden="true" className="sv-aurora pointer-events-none absolute -top-48 -left-32 size-[28rem] rounded-full bg-brand-sky/15 blur-3xl" />
      <span aria-hidden="true" className="sv-aurora sv-aurora-2 pointer-events-none absolute -right-32 -bottom-48 size-[26rem] rounded-full bg-gold/10 blur-3xl" />
      {data.draft && <p className="relative mb-6 inline-flex rounded-md border border-gold/50 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">{t.draft}</p>}

      <div className="relative grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        {/* Headline */}
        <div className="flex flex-col gap-5">
          <p className="sv-figure flex items-baseline gap-1 font-display leading-none font-semibold tabular-nums" aria-label={`${nf.format(data.pct)}% ${t.lower}`}>
            <span aria-hidden="true" className="text-[5.5rem] md:text-[7.5rem]">
              {nf.format(count)}
            </span>
            <span aria-hidden="true" className="text-5xl md:text-6xl">%</span>
          </p>
          <p className="sv-tag -mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-sm font-semibold text-gold">
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
              <path d="M8 3v10m0 0-4-4m4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.lower}
          </p>
          <h3 className="font-display text-3xl leading-tight font-semibold text-balance text-text-primary md:text-4xl">{data.title}</h3>
          {data.body && <p className="max-w-md leading-relaxed text-text-secondary">{data.body}</p>}
        </div>

        {/* The cost in blocks */}
        <figure className="flex flex-col gap-7 rounded-3xl border border-fg/[0.08] bg-fg/[0.02] p-5 md:p-7" aria-label={t.chart}>
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="font-semibold text-text-secondary">{data.beforeLabel}</span>
              <span className="font-mono font-semibold text-text-primary tabular-nums">{amount(data.before, 100)}</span>
            </div>
            <ol className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px] md:gap-1" aria-hidden="true">
              {Array.from({ length: BLOCKS }, (_, i) => (
                <li key={i} className="sv-block sv-before h-9 rounded-[5px] md:h-11" style={{ "--i": i } as CSSProperties} />
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="font-semibold text-text-primary">{data.afterLabel}</span>
              <span className="sv-after-amount font-mono font-semibold text-brand-sky tabular-nums">{amount(data.after, 100 - data.pct)}</span>
            </div>
            <ol className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px] md:gap-1" aria-hidden="true">
              {Array.from({ length: BLOCKS }, (_, i) => {
                const saved = i >= kept;
                // Saved blocks lift away from the far end inwards.
                return (
                  <li
                    key={i}
                    className={`sv-block h-9 rounded-[5px] md:h-11 ${saved ? "sv-saved" : "sv-kept"}`}
                    style={{ "--i": i, "--j": BLOCKS - 1 - i } as CSSProperties}
                  />
                );
              })}
            </ol>
            {/* A brace over the saved blocks, with the share saved */}
            <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px] md:gap-1" aria-hidden="true">
              <div className="sv-brace flex flex-col items-center gap-1.5" style={{ gridColumn: `${kept + 1} / span ${savedBlocks}`, transitionDelay: `${900 + savedBlocks * 70}ms` }}>
                <span className="h-2 w-full rounded-b-lg border-x border-b border-gold/60" />
                <span className="font-mono text-sm font-semibold whitespace-nowrap text-gold tabular-nums">
                  −{nf.format(data.pct)}% {t.saved}
                </span>
              </div>
            </div>
          </div>

          <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-fg/[0.08] pt-4 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-3 rounded-[3px] bg-gradient-to-br from-brand-royal to-brand-sky" />
              {t.pay}
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-3 rounded-[3px] border border-dashed border-gold/70 bg-gold/10" />
              {t.save}
            </span>
            <span className="ml-auto">{t.each}</span>
          </figcaption>

          {(data.source || data.note) && (
            <p className="-mt-3 text-xs leading-relaxed text-text-secondary">
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
