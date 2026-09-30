"use client";

import type { MarketPayload } from "@/lib/market/types";
import type { Messages } from "@/lib/i18n/messages";
import { fmt, signed } from "@/lib/market/format";
import { cn } from "@/lib/utils/cn";
import { MarketBadge } from "./MarketBadge";
import { useMarket } from "./useMarket";

/**
 * Scrolling DSE / CSE price strip: indices first, then every quote.
 * Pauses on hover; prices flash green or red when they move.
 */
export function MarketTicker({ initial, t, locale }: { initial: MarketPayload; t: Messages; locale: "en" | "bn" }) {
  const { data, moves } = useMarket(initial);
  const snap = data.snapshot;
  if (!snap) return null;

  const items = snap.exchanges.flatMap((ex) => [
    ...ex.indices.map((i) => ({ key: `${ex.exchange}-i-${i.name}`, label: i.name, value: fmt(locale, i.value), pct: i.changePct, index: true, move: undefined as undefined | "up" | "down" })),
    ...ex.quotes.map((q) => ({
      key: `${ex.exchange}-${q.symbol}`,
      label: q.symbol,
      value: fmt(locale, q.ltp, q.ltp >= 1000 ? 0 : 1),
      pct: q.changePct,
      index: false,
      move: moves[`${ex.exchange}:${q.symbol}`],
    })),
  ]);
  if (!items.length) return null;
  const loop = [...items, ...items];
  const duration = Math.max(40, items.length * 2.2);

  return (
    <section aria-label={t.tickerLabel} className="relative border-y border-fg/[0.08] bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[100rem] items-center">
        <div className="z-10 flex shrink-0 items-center gap-3 border-r border-fg/[0.08] bg-ink-950/80 px-4 py-3 md:px-6">
          <span className="font-mono text-xs font-semibold tracking-widest text-fg">DSE · CSE</span>
          <MarketBadge data={data} t={t} className="hidden sm:inline-flex" />
        </div>
        <div className="marquee relative min-w-0 flex-1 overflow-hidden">
          <ul className="marquee-track py-3" style={{ animationDuration: `${duration}s` }}>
            {loop.map((it, n) => {
              const up = it.pct > 0;
              const down = it.pct < 0;
              return (
                <li
                  key={`${it.key}-${n}`}
                  aria-hidden={n >= items.length ? true : undefined}
                  className={cn(
                    "flex items-center gap-2 px-5 font-mono text-[13px] whitespace-nowrap tabular-nums",
                    it.index && "border-x border-fg/[0.06] bg-fg/[0.02]",
                    it.move === "up" && "tick-flash-up",
                    it.move === "down" && "tick-flash-down",
                  )}
                >
                  <span className={cn("font-semibold", it.index ? "text-accent" : "text-fg")}>{it.label}</span>
                  <span className="text-text-secondary">{it.value}</span>
                  <span className={cn("font-semibold", up && "text-market-up", down && "text-market-down", !up && !down && "text-text-secondary")}>
                    {up ? "▲" : down ? "▼" : "•"} {signed(locale, it.pct, 2, "%")}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {data.mode === "demo" && (
        <p className="border-t border-amber-400/30 bg-amber-400/10 px-4 py-1 text-center demo-text text-[11px] font-semibold sm:hidden">{t.demoData}</p>
      )}
    </section>
  );
}
