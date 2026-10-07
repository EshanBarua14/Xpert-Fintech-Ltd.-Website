"use client";

import Link from "next/link";
import { useState } from "react";
import { fmt, signed } from "@/lib/market/format";
import { uniqueQuotes, type ExchangeSnapshot, type MarketPayload } from "@/lib/market/types";
import { cn } from "@/lib/utils/cn";
import { useMarket } from "./useMarket";

type Locale = "en" | "bn";
type Ex = "DSE" | "CSE";

export type TickerLabels = {
  region: string;
  pause: string;
  play: string;
  loading: string;
  unavailable: string;
  breadth: string;
  breadthShort: string;
  turnover: string;
  markets: string;
  board: string; // "{exchange} price board"
  demo: string;
  status: Record<NonNullable<ExchangeSnapshot["status"]>, string>;
};

type Item = {
  key: string;
  kind: "exchange" | "quote";
  label: string;
  value?: string;
  pct?: number;
  move?: "up" | "down";
  title?: string;
};

const QUOTES_PER_EXCHANGE = 60;

/** A price ticker: each listed stock's symbol, last price and change, biggest movers first. Indices live in the hero and the market cards. */
function itemsFor(ex: Ex, snap: ExchangeSnapshot | undefined, locale: Locale, moves: Record<string, "up" | "down">): Item[] {
  if (!snap) return [];
  return uniqueQuotes(snap.quotes)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, QUOTES_PER_EXCHANGE)
    .map((q) => ({ key: `${ex}-${q.symbol}`, kind: "quote" as const, label: q.symbol, value: fmt(locale, q.ltp, q.ltp >= 1000 ? 0 : 1), pct: q.changePct, move: moves[`${ex}:${q.symbol}`] }));
}

function Pct({ pct, locale }: { pct: number; locale: Locale }) {
  const up = pct > 0;
  const down = pct < 0;
  return (
    <span className={cn("font-semibold", up && "text-market-up", down && "text-market-down", !up && !down && "text-text-secondary")}>
      {up ? "▲" : down ? "▼" : "•"} {signed(locale, pct, 2, "%")}
    </span>
  );
}

function Cell({ it, locale }: { it: Item; locale: Locale }) {
  if (it.kind === "exchange") {
    return <span className="rounded-md bg-fg/[0.07] px-2 py-0.5 font-semibold tracking-widest text-fg">{it.label}</span>;
  }
  return (
    <>
      <span className="font-semibold text-fg">{it.label}</span>
      {it.value && <span className="text-text-secondary">{it.value}</span>}
      {it.pct !== undefined && Number.isFinite(it.pct) && <Pct pct={it.pct} locale={locale} />}
    </>
  );
}

/** One moving row of items; a second, hidden copy makes the loop seamless. */
function Lane({ items, locale, className }: { items: Item[]; locale: Locale; className?: string }) {
  const duration = Math.max(30, items.length * 2.6);
  const row = (copy: boolean) =>
    items.map((it) => (
      <li
        key={`${it.key}${copy ? "-c" : ""}`}
        className={cn(
          "flex items-center gap-1.5 px-3.5 whitespace-nowrap",
          copy && "ticker-copy",
          it.kind === "exchange" && "pl-5",
          it.move === "up" && "tick-flash-up",
          it.move === "down" && "tick-flash-down",
        )}
        aria-hidden={copy ? true : undefined}
        title={it.title}
      >
        <Cell it={it} locale={locale} />
      </li>
    ));
  return (
    <div className={cn("ticker-lane relative min-w-0 flex-1 overflow-hidden", className)}>
      <ul className="ticker-track h-full items-center font-mono text-[max(12px,0.75rem)] tabular-nums" style={{ animationDuration: `${duration}s` }}>
        {row(false)}
        {row(true)}
      </ul>
    </div>
  );
}

function StatusDot({ status }: { status?: ExchangeSnapshot["status"] }) {
  return <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", status === "OPEN" ? "animate-pulse bg-market-up" : status === "PRE_OPEN" ? "bg-gold" : "bg-text-secondary/60")} />;
}

/** Fixed head of a lane: exchange name (links to its price board) and its status. */
function LaneHead({ ex, snap, locale, labels }: { ex: Ex; snap?: ExchangeSnapshot; locale: Locale; labels: TickerLabels }) {
  return (
    <Link
      href={`/${locale}/markets/${ex.toLowerCase()}`}
      className="z-10 flex shrink-0 items-center gap-2 border-r border-fg/[0.08] bg-ink-950 px-3 font-mono text-[max(12px,0.75rem)] tabular-nums hover:bg-fg/[0.04] focus-visible:bg-fg/[0.06]"
      title={snap?.status ? `${labels.board.replace("{exchange}", ex)} · ${labels.status[snap.status]}` : labels.board.replace("{exchange}", ex)}
    >
      <StatusDot status={snap?.status} />
      <span className="font-semibold tracking-widest text-fg">{ex}</span>
      {snap?.status && <span className="sr-only">{labels.status[snap.status]}</span>}
    </Link>
  );
}

/**
 * The DSE · CSE price ticker at the very top of every page: each exchange's
 * stocks with last price and change, the day's biggest movers first. Wide
 * screens show the two exchanges side by side, each in its own lane; phones
 * and tablets show one lane with both. Indices are in the hero and the market
 * cards. Pauses on hover or focus and with its pause button; with reduced
 * motion it does not move and can be scrolled sideways instead. Data:
 * /api/market (refreshed every 20 s, shared with the other market widgets).
 */
export type TickerProps = { mode: MarketPayload["mode"]; locale: Locale; labels: TickerLabels };

export function TickerBar({ mode, locale, labels }: TickerProps) {
  const [initial] = useState<MarketPayload>(() => ({ mode, providerName: null, delayMinutes: 0, snapshot: null, shares: [] }));
  const { data, moves, loaded } = useMarket(initial);
  const [paused, setPaused] = useState(false);

  const byEx = (ex: Ex) => data.snapshot?.exchanges.find((e) => e.exchange === ex);
  // Prices only: Xpert's market share is shown in the market section, not in the ticker.
  const exchanges: Ex[] = (["DSE", "CSE"] as const).filter((ex) => byEx(ex));

  const combined = exchanges.flatMap((ex) => [
    { key: `${ex}-ex`, kind: "exchange" as const, label: ex },
    ...itemsFor(ex, byEx(ex), locale, moves),
  ]);

  return (
    <div role="region" aria-label={labels.region} className={cn("relative h-(--ticker-h) border-b border-fg/[0.08] bg-ink-950/90 backdrop-blur-xl", paused && "ticker-paused")}>
      <div className="flex h-full items-stretch">
        {exchanges.length === 0 ? (
          <p className="flex min-w-0 flex-1 items-center gap-2 truncate px-4 font-mono text-[max(12px,0.75rem)] text-text-secondary">
            <span className="font-semibold tracking-widest text-fg">DSE · CSE</span>
            <span className="truncate">{loaded ? labels.unavailable : labels.loading}</span>
          </p>
        ) : (
          <>
            {/* Phones and tablets: one lane with both exchanges */}
            <div className="flex min-w-0 flex-1 lg:hidden">
              <Link href={`/${locale}/markets`} className="z-10 flex shrink-0 items-center gap-2 border-r border-fg/[0.08] bg-ink-950 px-3 font-mono text-[max(12px,0.75rem)] font-semibold tracking-widest text-fg">
                <StatusDot status={byEx("DSE")?.status ?? byEx("CSE")?.status} />
                DSE · CSE
              </Link>
              <Lane items={combined} locale={locale} />
            </div>
            {/* Wide screens: DSE and CSE side by side */}
            {exchanges.map((ex, i) => (
              <div key={ex} className={cn("hidden min-w-0 flex-1 lg:flex", i > 0 && "border-l border-fg/[0.08]")}>
                <LaneHead ex={ex} snap={byEx(ex)} locale={locale} labels={labels} />
                <Lane items={itemsFor(ex, byEx(ex), locale, moves)} locale={locale} />
              </div>
            ))}
          </>
        )}
        <div className="z-10 flex shrink-0 items-center gap-1 border-l border-fg/[0.08] bg-ink-950 px-1.5">
          {data.mode === "demo" && <span className="demo-text hidden px-2 font-mono text-[max(11px,0.6875rem)] font-semibold sm:inline">{labels.demo}</span>}
          {exchanges.length > 0 && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              aria-label={paused ? labels.play : labels.pause}
              title={paused ? labels.play : labels.pause}
              className="flex size-7 items-center justify-center rounded-full text-text-secondary hover:bg-fg/[0.06] hover:text-fg"
            >
              {paused ? (
                <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 fill-current">
                  <path d="M3 1.5v9l7.5-4.5z" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 fill-current">
                  <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />
                </svg>
              )}
            </button>
          )}
          <Link href={`/${locale}/markets`} className="hidden h-7 items-center rounded-full px-2.5 text-[max(12px,0.75rem)] font-semibold text-brand-sky hover:bg-fg/[0.06] sm:flex">
            {labels.markets}
          </Link>
        </div>
      </div>
    </div>
  );
}
