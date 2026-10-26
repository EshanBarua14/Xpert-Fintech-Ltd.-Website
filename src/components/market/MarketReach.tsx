"use client";

import { type CSSProperties, type ReactNode } from "react";
import { ShareCoin3D } from "./ShareCoin3D";
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
  headline?: { pct: number | null; asOf: string | null; plus?: boolean; dse?: number; cse?: number; source?: string; sourceUrl?: string; note?: { en: string; bn?: string } } | null;
  goal: { targetPct: number; year: number; note: string | null } | null;
  clientBase: { value: number; label: string }[];
  /** Admin → Figures: more numbers with their source, in the same card. */
  figures?: { value: string; label: string; source: string }[];
  /** Outside the live site: where figures still to come go. */
  figureSlot?: ReactNode;
  /** Card heading when figures are shown with the client base (e.g. "Xpert Fintech in numbers"). */
  numbersTitle?: string;
  locale: "en" | "bn";
  labels: ReachLabels;
};

const fmt = (locale: string, v: number, digits: number) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);

type ExchangeFigure = { exchange: "DSE" | "CSE"; pct: number | null; date: string | null };

const fill = (v: number) => `${Math.max(0, Math.min(100, v))}%`;
const dayMonth = (locale: string, d: string) =>
  new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

/** One exchange as a compact row: its figure and a thin bar against the goal, or "Figure to be published". */
function ExchangeRow({ f, goal, locale, labels }: { f: ExchangeFigure; goal: Props["goal"]; locale: "en" | "bn"; labels: ReachLabels }) {
  const has = f.pct !== null;
  return (
    <li className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 py-3">
      <span className="rounded-md bg-brand-sky/15 px-2 py-1 text-center font-mono text-xs font-semibold tracking-wide text-brand-sky">{f.exchange}</span>
      {has ? (
        <div aria-hidden="true" data-reveal className="tube3d tube3d-grow h-2.5">
          <span className="tube3d-fill" style={{ width: fill(f.pct!) }} />
          {goal && <span className="tube3d-goal" style={{ left: fill(goal.targetPct) }} />}
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
 * Xpert Fintech's share of DSE and CSE turnover against the goal set in Admin → Market
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
  // Years are written without a thousands separator (2028, ২০২৮).
  const year = goal ? String(goal.year).replace(/\d/g, (d) => (locale === "bn" ? "০১২৩৪৫৬৭৮৯"[Number(d)]! : d)) : "";
  const goalPct = goal ? fmt(locale, goal.targetPct, 0) : "";
  const meterNow = hero?.pct ?? null;
  const numbers = clientBase.length > 0 || figures.length > 0 || figureSlot;

  return (
    <div className="flex flex-col gap-5">
      <div data-reveal className="pro-beam pro-mesh relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-brand-sky/[0.07] blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          {/* Headline */}
          <div className="flex flex-col justify-center gap-3">
            <p className="text-sm font-medium text-text-secondary">{labels.share}</p>
            {hero ? (
              <>
                {/* The share as a 3D pie instead of a big printed number; the figure rides on its label. */}
                <ShareCoin3D
                  pct={hero.pct}
                  plus={Boolean(headline?.plus) && (hero.pct === headline?.dse || hero.pct === headline?.cse || hero.pct === headline?.pct)}
                  caption={hero.caption}
                  goal={goal ? { pct: goal.targetPct, label: "" } : null}
                  label={`${labels.share}: ${fmt(locale, hero.pct, Number.isInteger(hero.pct) ? 0 : 2)}%${headline?.plus ? "+" : ""} (${hero.caption})`}
                  locale={locale}
                  className="-mx-2 sm:mx-0"
                />
              </>
            ) : (
              goal && <p className="max-w-md font-display text-3xl leading-tight tracking-[-0.015em] text-balance md:text-4xl">{labels.goalLead.replace("{pct}", goalPct).replace("{year}", year)}</p>
            )}
          </div>

          {/* Right: the goal (told once), then only the exchanges not already in the ring, then where the figure comes from. */}
          <div className="flex flex-col justify-center gap-7">
            {goal && (
              <div className="flex flex-col gap-3 rounded-2xl border border-gold/30 bg-gold/[0.05] p-5 md:p-6">
                <p className="text-xs font-semibold tracking-wide text-gold uppercase">{locale === "bn" ? "লক্ষ্য" : "Goal"}</p>
                <p className="flex items-baseline gap-3">
                  <span className="font-display text-5xl leading-none font-semibold tracking-[-0.03em] text-text-primary tabular-nums">{goalPct}%</span>
                  <span className="text-sm font-semibold text-text-secondary">{locale === "bn" ? `${year} সালের মধ্যে` : `by ${year}`}</span>
                </p>
                {meterNow !== null && (
                  <p className="text-sm font-semibold text-text-primary">
                    {meterNow >= goal.targetPct ? labels.reached : labels.toGo.replace("{pts}", fmt(locale, goal.targetPct - meterNow, 1))}
                  </p>
                )}
                <p className="text-sm leading-relaxed text-text-secondary">{goal.note ?? labels.goalNote.replace("{year}", year)}</p>
              </div>
            )}
            {/* Exchanges whose figure is not the one in the ring. */}
            {perExchange.some((f) => !(hero && f.pct === hero.pct && hero.caption.startsWith(f.exchange))) && (
              <ul className="divide-y divide-fg/[0.07] border-y border-fg/[0.07]">
                {perExchange
                  .filter((f) => !(hero && f.pct === hero.pct && hero.caption.startsWith(f.exchange)))
                  .map((f) => (
                    <ExchangeRow key={f.exchange} f={f} goal={goal} locale={locale} labels={labels} />
                  ))}
              </ul>
            )}
            {hero && (headline?.note || headline?.source) && (
              <div className="flex flex-col gap-1.5">
                {headline?.note && <p className="text-sm leading-relaxed text-text-secondary">{(locale === "bn" && headline.note.bn) || headline.note.en}</p>}
                <SourceLink url={headline?.sourceUrl} name={headline?.source} label={labels.source ?? "Source"} className="text-xs text-text-secondary" />
              </div>
            )}
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
                <dd className="order-3 text-xs text-text-secondary">{f.source}</dd>
              </div>
            ))}
          </dl>
          {figureSlot}
        </div>
      )}
    </div>
  );
}
