"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CountUp } from "@/components/motion/CountUp";
import type { ShareFigure } from "@/lib/market/types";
import { cn } from "@/lib/utils/cn";

export type ReachLabels = {
  share: string;
  combined: string;
  goal: string;
  goalLead: string;
  goalNote: string;
  toGo: string;
  reached: string;
  now: string;
  clients: string;
  progress: string;
  /** "DSE and CSE combined" (+ " · {date}" when dated) for the stated overall share. */
  overall?: string;
  /** "Share of {exchange} turnover", above each exchange's own figure. */
  exchange?: string;
  /** Under an exchange with no figure yet ("Figure to be published"). */
  pending?: string;
};

type Props = {
  shares: ShareFigure[];
  /** Overall share stated by XFL (Admin → Market data); shown instead of the computed one. */
  headline?: { pct: number | null; asOf: string | null; dse?: number; cse?: number } | null;
  goal: { targetPct: number; year: number; note: string | null } | null;
  clientBase: { value: number; label: string }[];
  /** Admin → Figures: more numbers with their source, in the same card. */
  figures?: { value: string; label: string; source: string }[];
  /** Outside the live site: where figures still to come go. */
  figureSlot?: ReactNode;
  /** Card heading when figures are shown with the client base (e.g. "Xpert in numbers"). */
  numbersTitle?: string;
  locale: "en" | "bn";
  labels: ReachLabels;
};

const fmt = (locale: string, v: number, digits: number) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);

/** Counts a percentage up from zero once it is on screen (the real figure is in the server HTML). */
function useCountUp(target: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(target);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShown(0);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 1600);
        setShown(target * (1 - Math.pow(1 - p, 4)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target]);
  return { ref, shown };
}

/**
 * Xpert's share of DSE and CSE turnover (both exchanges' latest published
 * figures combined), the progress towards the goal set in Admin → Market
 * data, and the client base. With no figure yet, the goal stands on its own.
 */
type ExchangeFigure = { exchange: "DSE" | "CSE"; pct: number | null; date: string | null };

/** One exchange's share, counting up once on screen, with its own bar against the goal; a dash until its figure is published. */
function ExchangeShare({ f, goal, goalPct, locale, labels, year }: { f: ExchangeFigure; goal: Props["goal"]; goalPct: string; locale: "en" | "bn"; labels: ReachLabels; year: string }) {
  const { ref, shown } = useCountUp(f.pct ?? 0);
  const date = f.date ? new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${f.date}T00:00:00Z`)) : null;
  const fill = (v: number) => `${Math.max(0, Math.min(100, v))}%`;
  const has = f.pct !== null;
  return (
    <div ref={ref} className="flex flex-col gap-4 rounded-2xl border border-fg/[0.08] bg-fg/[0.02] p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <span className="rounded-md bg-brand-sky/15 px-2 py-0.5 font-mono text-xs font-semibold tracking-wide text-brand-sky">{f.exchange}</span>
          <span>{(labels.exchange ?? "{exchange}").replace("{exchange}", f.exchange)}</span>
        </p>
        <p className={cn("font-display text-6xl leading-none tracking-[-0.03em] tabular-nums md:text-7xl", has ? "text-text-primary" : "text-text-secondary/50")}>
          {has ? fmt(locale, shown, Number.isInteger(f.pct) ? 0 : 2) : "—"}
          <span className="ml-1 text-[0.5em] text-text-secondary">%</span>
        </p>
        <p className="text-sm text-text-secondary">{has ? date : labels.pending}</p>
      </div>
      {goal && (
        <div className="flex flex-col gap-2">
          <div
            role={has ? "img" : undefined}
            aria-label={has ? labels.progress.replace("{now}", fmt(locale, f.pct!, 2)).replace("{pct}", goalPct).replace("{year}", year) : undefined}
            className="relative h-3 rounded-full bg-fg/[0.08]"
          >
            {has && (
              <div className="bar-grow absolute inset-0" data-reveal>
                <span className="absolute inset-y-0 left-0 block rounded-full bg-gradient-to-r from-brand-royal to-brand-sky" style={{ width: fill(f.pct!) }} />
              </div>
            )}
            <span aria-hidden="true" className="absolute -top-2 -bottom-2 w-0.5 rounded-full bg-gold" style={{ left: fill(goal.targetPct) }} />
          </div>
          <div aria-hidden="true" className="flex justify-between font-mono text-xs text-text-secondary">
            <span>{fmt(locale, 0, 0)}%</span>
            <span>{fmt(locale, 100, 0)}%</span>
          </div>
          {has && (
            <p className="text-sm text-text-secondary">
              {f.pct! >= goal.targetPct ? labels.reached : labels.toGo.replace("{pts}", fmt(locale, goal.targetPct - f.pct!, 1))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Xpert's share of DSE and of CSE turnover, each on its own (the two differ),
 * as stated in Admin → Market data or worked out from the daily figures; each
 * against the goal set there; and the client base. A combined figure is shown
 * only when neither exchange has one. With no figure yet, the goal stands on its own.
 */
export function MarketReach({ shares, headline, goal, clientBase, figures = [], figureSlot, numbersTitle, locale, labels }: Props) {
  const stated = headline && (headline.dse !== undefined || headline.cse !== undefined);
  // DSE and CSE always side by side; an exchange without its own figure shows a dash until it is published.
  const perExchange: ExchangeFigure[] = (["DSE", "CSE"] as const).map((x): ExchangeFigure => {
    const own = x === "DSE" ? headline?.dse : headline?.cse;
    if (own !== undefined) return { exchange: x, pct: own, date: headline?.asOf ?? null };
    const daily = headline?.pct != null && !stated ? undefined : shares.find((f) => f.exchange === x);
    return daily ? { exchange: x, pct: daily.sharePct, date: daily.tradeDate } : { exchange: x, pct: null, date: null };
  });
  const showPanels = goal !== null || perExchange.some((f) => f.pct !== null) || headline?.pct != null;
  // A combined figure XFL stated, shown above the two exchanges while neither has its own.
  const pct = !stated && perExchange.every((f) => f.pct === null) ? (headline?.pct ?? null) : null;
  const { ref, shown } = useCountUp(pct ?? 0);
  const date = (d: string) =>
    new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
  // Years are written without a thousands separator (2028, ২০২৮).
  const year = goal ? String(goal.year).replace(/\d/g, (d) => (locale === "bn" ? "০১২৩৪৫৬৭৮৯"[Number(d)]! : d)) : "";
  const goalPct = goal ? fmt(locale, goal.targetPct, 0) : "";
  const goalText = goal ? labels.goal.replace("{pct}", goalPct).replace("{year}", year) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div ref={ref} data-reveal className="relative flex flex-col gap-8 overflow-hidden rounded-3xl border border-fg/10 bg-navy-900 p-6 sm:p-8 md:p-10">
        {showPanels && (
          <>
            {pct !== null && (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="font-display text-4xl leading-none tracking-[-0.02em] text-text-primary tabular-nums md:text-5xl">
                  {fmt(locale, shown, Number.isInteger(pct) ? 0 : 2)}
                  <span className="ml-1 text-[0.5em] text-text-secondary">%</span>
                </p>
                <p className="text-sm text-text-secondary">{`${labels.overall ?? labels.combined}${headline?.asOf ? ` · ${date(headline.asOf)}` : ""}`}</p>
              </div>
            )}
            {goalText && (
              <p className="flex items-center gap-2 text-sm font-semibold text-gold">
                <span aria-hidden="true" className="inline-block h-4 w-0.5 rounded-full bg-gold" />
                {goalText}
              </p>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              {perExchange.map((f) => (
                <ExchangeShare key={f.exchange} f={f} goal={goal} goalPct={goalPct} locale={locale} labels={labels} year={year} />
              ))}
            </div>
            {goal && <p className="text-sm text-text-secondary">{goal.note ?? labels.goalNote.replace("{year}", year)}</p>}
          </>
        )}
      </div>

      {clientBase.length > 0 && (
        <div data-reveal style={{ "--d": 1 } as CSSProperties} className="flex flex-col gap-6 rounded-3xl border border-fg/10 bg-navy-900 p-6 sm:p-8 md:p-10">
          <h3 className="font-display text-2xl leading-tight">{(figures.length || figureSlot) && numbersTitle ? numbersTitle : labels.clients}</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-1 xl:grid-cols-2">
            {clientBase.map((c) => (
              <div key={c.label} className="flex flex-col gap-1 border-l-2 border-brand-sky/50 pl-4">
                <dd className="order-1 font-display text-4xl leading-none tracking-[-0.02em] text-text-primary md:text-5xl">
                  <CountUp value={c.value} locale={locale} />
                </dd>
                <dt className="order-2 text-sm text-text-secondary">{c.label}</dt>
              </div>
            ))}
            {figures.map((f) => (
              <div key={`${f.value}-${f.label}`} className="flex flex-col gap-1 border-l-2 border-gold/60 pl-4">
                <dd className="order-1 font-display text-4xl leading-none tracking-[-0.02em] text-text-primary md:text-5xl">{f.value}</dd>
                <dt className="order-2 text-sm text-text-secondary">{f.label}</dt>
                <dd className="order-3 text-xs text-text-secondary/80">{f.source}</dd>
              </div>
            ))}
          </dl>
          {figureSlot}
        </div>
      )}
    </div>
  );
}
