"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
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
};

type Props = {
  shares: ShareFigure[];
  /** Overall share stated by XFL (Admin → Market data); shown instead of the computed one. */
  headline?: { pct: number; asOf: string | null } | null;
  goal: { targetPct: number; year: number; note: string | null } | null;
  clientBase: { value: number; label: string }[];
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
export function MarketReach({ shares, headline, goal, clientBase, locale, labels }: Props) {
  const xpert = shares.reduce((s, f) => s + f.xpertTurnover, 0);
  const market = shares.reduce((s, f) => s + f.marketTurnover, 0);
  const pct = headline ? headline.pct : market > 0 ? (xpert / market) * 100 : null;
  const { ref, shown } = useCountUp(pct ?? 0);
  const date = (d: string) =>
    new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
  const fill = (v: number) => `${Math.max(0, Math.min(100, v))}%`;
  // Years are written without a thousands separator (2028, ২০২৮).
  const year = goal ? String(goal.year).replace(/\d/g, (d) => (locale === "bn" ? "০১২৩৪৫৬৭৮৯"[Number(d)]! : d)) : "";
  const goalText = goal ? labels.goal.replace("{pct}", fmt(locale, goal.targetPct, 0)).replace("{year}", year) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div ref={ref} data-reveal className="relative flex flex-col gap-8 overflow-hidden rounded-3xl border border-fg/10 bg-navy-900 p-6 sm:p-8 md:p-10">
        {pct !== null ? (
          <>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-text-secondary">{labels.share}</p>
              <p className="font-display text-6xl leading-none tracking-[-0.03em] text-text-primary tabular-nums sm:text-7xl md:text-8xl">
                {fmt(locale, shown, headline && Number.isInteger(headline.pct) ? 0 : 2)}
                <span className="ml-1 text-[0.5em] text-text-secondary">%</span>
              </p>
              <p className="text-sm text-text-secondary">
                {headline ? `${labels.overall ?? labels.combined}${headline.asOf ? ` · ${date(headline.asOf)}` : ""}` : labels.combined}
              </p>
            </div>
            {!headline && (
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {shares.map((s) => (
                <li key={s.exchange} className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-text-primary">{s.exchange}</span>
                  <span className="font-mono text-base text-brand-sky">{fmt(locale, s.sharePct, 2)}%</span>
                  <span className="text-xs text-text-secondary">{date(s.tradeDate)}</span>
                </li>
              ))}
            </ul>
            )}
          </>
        ) : (
          goal && (
            <p className="max-w-xl font-display text-3xl leading-tight tracking-[-0.015em] text-balance md:text-4xl">
              {labels.goalLead.replace("{pct}", fmt(locale, goal.targetPct, 0)).replace("{year}", year)}
            </p>
          )
        )}

        {goal && (
          <div className="flex flex-col gap-4">
            <div
              role={pct !== null ? "img" : undefined}
              aria-label={
                pct !== null
                  ? labels.progress.replace("{now}", fmt(locale, pct, 2)).replace("{pct}", fmt(locale, goal.targetPct, 0)).replace("{year}", year)
                  : undefined
              }
              className="relative pt-9"
            >
              {/* Goal marker: label above the line, kept inside the card near the right edge. */}
              <span
                aria-hidden={pct !== null}
                className={cn("absolute top-0 text-sm font-semibold whitespace-nowrap text-gold", goal.targetPct > 60 ? "-translate-x-full pr-2" : "pl-2")}
                style={{ left: fill(goal.targetPct) }}
              >
                {goalText}
              </span>
              <div className="relative h-3 rounded-full bg-fg/[0.08]">
                <div className="bar-grow absolute inset-0" data-reveal>
                  <span className="absolute inset-y-0 left-0 block rounded-full bg-gradient-to-r from-brand-royal to-brand-sky" style={{ width: fill(pct ?? 0) }} />
                </div>
                <span aria-hidden="true" className="absolute -top-2 -bottom-2 w-0.5 rounded-full bg-gold" style={{ left: fill(goal.targetPct) }} />
              </div>
              <div aria-hidden="true" className="mt-2 flex justify-between font-mono text-xs text-text-secondary">
                <span>{fmt(locale, 0, 0)}%</span>
                <span>{fmt(locale, 100, 0)}%</span>
              </div>
            </div>
            <p className="text-sm text-text-secondary">
              {pct !== null && (pct >= goal.targetPct ? labels.reached : labels.toGo.replace("{pts}", fmt(locale, goal.targetPct - pct, 1))) + ". "}
              {goal.note ?? labels.goalNote.replace("{year}", year)}
            </p>
          </div>
        )}
      </div>

      {clientBase.length > 0 && (
        <div data-reveal style={{ "--d": 1 } as CSSProperties} className="flex flex-col gap-6 rounded-3xl border border-fg/10 bg-navy-900 p-6 sm:p-8 md:p-10">
          <h3 className="font-display text-2xl leading-tight">{labels.clients}</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-1 xl:grid-cols-2">
            {clientBase.map((c) => (
              <div key={c.label} className="flex flex-col gap-1 border-l-2 border-brand-sky/50 pl-4">
                <dd className="order-1 font-display text-4xl leading-none tracking-[-0.02em] text-text-primary md:text-5xl">
                  <CountUp value={c.value} locale={locale} />
                </dd>
                <dt className="order-2 text-sm text-text-secondary">{c.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
