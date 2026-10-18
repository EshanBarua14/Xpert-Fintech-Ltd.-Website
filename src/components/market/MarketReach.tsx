"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CountUp } from "@/components/motion/CountUp";
import { SourceLink } from "@/components/insights/SourceLink";
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
  /** "Source", before the link to where the figures come from. */
  source?: string;
};

type Props = {
  shares: ShareFigure[];
  /** Overall share stated by XFL (Admin → Market data); shown instead of the computed one. */
  headline?: { pct: number | null; asOf: string | null; dse?: number; cse?: number; source?: string; sourceUrl?: string; note?: { en: string; bn?: string } } | null;
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

type ExchangeFigure = { exchange: "DSE" | "CSE"; pct: number | null; date: string | null };

const fill = (v: number) => `${Math.max(0, Math.min(100, v))}%`;
const dayMonth = (locale: string, d: string) =>
  new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

/** The goal meter: filled to today's share (when there is one), a gold mark at the goal, 0–100 underneath. */
function GoalMeter({ now, goal, goalText, label, locale }: { now: number | null; goal: { targetPct: number }; goalText: string; label?: string; locale: "en" | "bn" }) {
  return (
    <div role={label ? "img" : undefined} aria-label={label} className="relative pt-8">
      <span
        aria-hidden={label ? true : undefined}
        className={cn("absolute top-0 text-xs font-semibold whitespace-nowrap text-gold", goal.targetPct > 60 ? "-translate-x-full pr-2" : "pl-2")}
        style={{ left: fill(goal.targetPct) }}
      >
        {goalText}
      </span>
      <div className="relative h-3 rounded-full bg-brand-sky/[0.12]">
        {now !== null && (
          <div className="bar-grow absolute inset-0" data-reveal>
            <span className="absolute inset-y-0 left-0 block rounded-full bg-gradient-to-r from-brand-royal to-brand-sky" style={{ width: fill(now) }} />
          </div>
        )}
        <span aria-hidden="true" className="absolute -top-1.5 -bottom-1.5 w-0.5 rounded-full bg-gold" style={{ left: fill(goal.targetPct) }} />
      </div>
      <div aria-hidden="true" className="mt-2 flex justify-between font-mono text-[11px] text-text-secondary">
        <span>{fmt(locale, 0, 0)}%</span>
        <span>{fmt(locale, 100, 0)}%</span>
      </div>
    </div>
  );
}

/** One exchange as a compact row: its figure and a thin bar against the goal, or "Figure to be published". */
function ExchangeRow({ f, goal, locale, labels }: { f: ExchangeFigure; goal: Props["goal"]; locale: "en" | "bn"; labels: ReachLabels }) {
  const has = f.pct !== null;
  return (
    <li className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 py-3">
      <span className="rounded-md bg-brand-sky/15 px-2 py-1 text-center font-mono text-xs font-semibold tracking-wide text-brand-sky">{f.exchange}</span>
      {has ? (
        <div aria-hidden="true" className="relative h-1.5 rounded-full bg-brand-sky/[0.12]">
          <span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-royal to-brand-sky" style={{ width: fill(f.pct!) }} />
          {goal && <span className="absolute -top-1 -bottom-1 w-px bg-gold" style={{ left: fill(goal.targetPct) }} />}
        </div>
      ) : (
        <span className="text-sm text-text-secondary">{labels.pending ?? "—"}</span>
      )}
      <span className="text-right text-sm">
        {has ? (
          <>
            <span className="font-display text-xl text-text-primary">{fmt(locale, f.pct!, Number.isInteger(f.pct) ? 0 : 2)}%</span>
            {f.date && <span className="ml-2 text-xs text-text-secondary">{dayMonth(locale, f.date)}</span>}
          </>
        ) : (
          <span className="font-display text-xl text-text-secondary/50">—</span>
        )}
      </span>
    </li>
  );
}

/**
 * Xpert's share of DSE and CSE turnover against the goal set in Admin → Market
 * data, and the client base underneath.
 *  - One headline figure: the combined share XFL stated, or, when only one
 *    exchange has a figure, that one.
 *  - DSE and CSE as two compact rows, each with its own figure once published
 *    ("Figure to be published" until then; nothing is invented).
 *  - The client base and Admin → Figures as one row of numbers across the width.
 */
export function MarketReach({ shares, headline, goal, clientBase, figures = [], figureSlot, numbersTitle, locale, labels }: Props) {
  const stated = headline && (headline.dse !== undefined || headline.cse !== undefined);
  const perExchange: ExchangeFigure[] = (["DSE", "CSE"] as const).map((x): ExchangeFigure => {
    const own = x === "DSE" ? headline?.dse : headline?.cse;
    if (own !== undefined) return { exchange: x, pct: own, date: headline?.asOf ?? null };
    const daily = headline?.pct != null && !stated ? undefined : shares.find((f) => f.exchange === x);
    return daily ? { exchange: x, pct: daily.sharePct, date: daily.tradeDate } : { exchange: x, pct: null, date: null };
  });
  const known = perExchange.filter((f) => f.pct !== null);
  // The headline: the combined figure while neither exchange has its own; otherwise the only exchange that has one.
  const combined = !stated && known.length === 0 ? (headline?.pct ?? null) : null;
  const hero: { pct: number; caption: string } | null =
    combined !== null
      ? { pct: combined, caption: `${labels.overall ?? labels.combined}${headline?.asOf ? ` · ${dayMonth(locale, headline.asOf)}` : ""}` }
      : known.length === 1
        ? { pct: known[0]!.pct!, caption: `${known[0]!.exchange}${known[0]!.date ? ` · ${dayMonth(locale, known[0]!.date)}` : ""}` }
        : null;
  const { ref, shown } = useCountUp(hero?.pct ?? 0);
  // Years are written without a thousands separator (2028, ২০২৮).
  const year = goal ? String(goal.year).replace(/\d/g, (d) => (locale === "bn" ? "০১২৩৪৫৬৭৮৯"[Number(d)]! : d)) : "";
  const goalPct = goal ? fmt(locale, goal.targetPct, 0) : "";
  const goalText = goal ? labels.goal.replace("{pct}", goalPct).replace("{year}", year) : "";
  const meterNow = hero?.pct ?? null;
  const numbers = clientBase.length > 0 || figures.length > 0 || figureSlot;

  return (
    <div className="flex flex-col gap-5">
      <div ref={ref} data-reveal className="relative overflow-hidden rounded-3xl border border-fg/10 bg-navy-900 p-6 sm:p-8 md:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-brand-sky/[0.07] blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          {/* Headline */}
          <div className="flex flex-col justify-center gap-3">
            <p className="text-sm font-medium text-text-secondary">{labels.share}</p>
            {hero ? (
              <>
                <p className="font-display text-7xl leading-none tracking-[-0.03em] text-text-primary md:text-8xl">
                  {fmt(locale, shown, Number.isInteger(hero.pct) ? 0 : 2)}
                  <span className="ml-1 text-[0.45em] text-text-secondary">%</span>
                </p>
                <p className="text-sm text-text-secondary">{hero.caption}</p>
                {headline?.note && <p className="text-sm text-text-secondary">{(locale === "bn" && headline.note.bn) || headline.note.en}</p>}
                <SourceLink url={headline?.sourceUrl} name={headline?.source} label={labels.source ?? "Source"} className="text-xs text-text-secondary" />
              </>
            ) : (
              goal && <p className="max-w-md font-display text-3xl leading-tight tracking-[-0.015em] text-balance md:text-4xl">{labels.goalLead.replace("{pct}", goalPct).replace("{year}", year)}</p>
            )}
          </div>

          {/* Goal and the two exchanges */}
          <div className="flex flex-col gap-6">
            {goal && (
              <div className="flex flex-col gap-3">
                <GoalMeter
                  now={meterNow}
                  goal={goal}
                  goalText={goalText}
                  locale={locale}
                  label={meterNow !== null ? labels.progress.replace("{now}", fmt(locale, meterNow, 2)).replace("{pct}", goalPct).replace("{year}", year) : undefined}
                />
                <p className="text-sm text-text-secondary">
                  {meterNow !== null && <span className="font-semibold text-text-primary">{(meterNow >= goal.targetPct ? labels.reached : labels.toGo.replace("{pts}", fmt(locale, goal.targetPct - meterNow, 1))) + ". "}</span>}
                  {goal.note ?? labels.goalNote.replace("{year}", year)}
                </p>
              </div>
            )}
            <ul className="divide-y divide-fg/[0.07] border-y border-fg/[0.07]">
              {perExchange.map((f) => (
                <ExchangeRow key={f.exchange} f={f} goal={goal} locale={locale} labels={labels} />
              ))}
            </ul>
          </div>
        </div>
      </div>

      {numbers && (
        <div data-reveal style={{ "--d": 1 } as CSSProperties} className="flex flex-col gap-5 rounded-3xl border border-fg/10 bg-navy-900 p-6 sm:p-8">
          <h3 className="font-display text-xl leading-tight">{(figures.length || figureSlot) && numbersTitle ? numbersTitle : labels.clients}</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4">
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
