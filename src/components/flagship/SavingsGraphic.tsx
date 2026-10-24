"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Emph } from "@/components/ui/Emph";

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
    each: "Bars drawn to scale",
    source: "Source",
    draft: "Draft: only visible outside the live site",
    chart: "Cost before and with Xpert",
  },
  bn: {
    lower: "কম খরচ",
    saved: "সাশ্রয়",
    pay: "যা খরচ হয়",
    save: "যা সাশ্রয় হয়",
    each: "বারগুলো আনুপাতিক মাপে",
    source: "সূত্র",
    draft: "খসড়া: লাইভ সাইটে দেখা যায় না",
    chart: "এক্সপার্টের আগে ও পরে খরচ",
  },
};


/**
 * Admin → Home highlights → Cost savings, as two bars drawn to scale: the cost
 * before Xpert, then the cost with Xpert, where the share no longer paid is
 * outlined in gold. The bars extend when scrolled into view (one calm ease-out),
 * then the saving is marked and the headline percentage counts up. Figures come
 * only from the admin, with their source; reduced motion shows the final state.
 */
export function SavingsGraphic({ data, locale }: { data: SavingsData; locale: "en" | "bn" }) {
  const t = TEXT[locale];
  const root = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [split, setSplit] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      setOn(true);
      setSplit(true);
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

  // The bars extend, then the saving is marked while the percentage counts up.
  useEffect(() => {
    if (!on || split) return;
    const id = window.setTimeout(() => setSplit(true), 1000);
    return () => window.clearTimeout(id);
  }, [on, split]);
  useEffect(() => {
    if (!split || count === data.pct) return;
    let raf = 0;
    const delay = 0;
    const length = 1100;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const k = Math.max(0, Math.min(1, (now - start) / length));
      setCount(Math.round((1 - Math.pow(1 - k, 2)) * data.pct));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [split, data.pct]);

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
          <p className="sv-figure flex items-baseline gap-1 font-display leading-none font-semibold tabular-nums">
            <span className="sr-only">{`${nf.format(data.pct)}% ${t.lower}`}</span>
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
          <h3 className="font-display text-3xl leading-tight font-semibold text-balance text-text-primary md:text-4xl"><Emph text={data.title} /></h3>
          {data.body && <p className="max-w-md leading-relaxed text-text-secondary">{data.body}</p>}
        </div>

        {/* The cost in blocks */}
        <figure className="pro-beam pro-mesh flex flex-col gap-7 rounded-3xl p-5 md:p-7" aria-label={t.chart}>
          {/* Two bars to scale: the cost before, and with Xpert, where the part no longer paid is outlined in gold. */}
          <div className={`svb flex flex-col gap-6 ${on ? "is-on" : ""} ${split ? "is-split" : ""}`} role="img" aria-label={`${data.beforeLabel}: ${amount(data.before, 100)}. ${data.afterLabel}: ${amount(data.after, 100 - data.pct)}. −${nf.format(data.pct)}% ${t.saved}.`}>
            <div className="flex flex-col gap-2.5" aria-hidden="true">
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="font-semibold text-text-secondary">{data.beforeLabel}</span>
                <span className="font-mono font-semibold text-[#d9473f] tabular-nums">{amount(data.before, 100)}</span>
              </div>
              <div className="svb-track">
                <span className="svb-bar svb-before" style={{ "--w": "100%" } as CSSProperties} />
              </div>
            </div>
            <div className="flex flex-col gap-2.5" aria-hidden="true">
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="font-semibold text-text-primary">{data.afterLabel}</span>
                <span className="font-mono font-semibold text-brand-sky tabular-nums">{amount(data.after, 100 - data.pct)}</span>
              </div>
              <div className="svb-track">
                <span className="svb-bar svb-after pro-shimmer" style={{ "--w": `${100 - data.pct}%` } as CSSProperties} />
                <span className="svb-saved" style={{ left: `${100 - data.pct}%`, width: `${data.pct}%` } as CSSProperties}>
                  <span className="svb-saved-label">−{nf.format(data.pct)}% {t.saved}</span>
                </span>
              </div>
              <div className="relative h-4 font-mono text-[11px] text-text-secondary">
                <span className="absolute left-0">0</span>
                <span className="absolute -translate-x-1/2" style={{ left: `${100 - data.pct}%` }}>
                  {nf.format(100 - data.pct)}%
                </span>
                <span className="absolute right-0">100%</span>
              </div>
            </div>
          </div>

          <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-fg/[0.08] pt-4 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-3 rounded-[3px] bg-gradient-to-br from-[#1e64c8] to-[#22bceb]" />
              {t.pay}
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-3 rounded-[3px] bg-gradient-to-br from-[#f0857d] to-[#d9473f]" />
              {data.beforeLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-3 rounded-[3px] border border-dashed border-[#d9a640] bg-[#e0b252]/20" />
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
