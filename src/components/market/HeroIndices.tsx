"use client";

import type { Messages } from "@/lib/i18n/messages";
import { fmt } from "@/lib/market/format";
import { INDEX_SLOTS, type MarketPayload } from "@/lib/market/types";
import { cn } from "@/lib/utils/cn";
import { useMarket } from "./useMarket";

/**
 * The hero's market panel: DSE and CSE side by side, each with its status and
 * main indices (value and change), live. Indices an exchange does not publish
 * are left out; with none at all, its advancers and decliners show instead.
 */
export function HeroIndices({ initial, t, locale }: { initial: MarketPayload; t: Messages; locale: "en" | "bn" }) {
  const { data } = useMarket(initial);
  const exchanges = (["DSE", "CSE"] as const).map((x) => ({ x, ex: data.snapshot?.exchanges.find((e) => e.exchange === x) })).filter((e) => e.ex);
  if (!exchanges.length) return null;
  return (
    <div className="flex max-w-[36rem] flex-col gap-2">
      <div className="grid gap-px overflow-hidden rounded-2xl border border-fg/10 bg-fg/10 sm:grid-cols-2">
        {exchanges.map(({ x, ex }) => {
          const open = ex!.status === "OPEN";
          const indices = INDEX_SLOTS[x].map((n) => ex!.indices.find((i) => i.name.toUpperCase() === n)).filter((i): i is NonNullable<typeof i> => !!i);
          return (
            <a key={x} href={`/${locale}/markets/${x.toLowerCase()}`} className="group flex flex-col gap-2.5 bg-ink-950/85 p-4 transition-colors hover:bg-navy-900">
              <span className="flex items-center gap-2 text-sm">
                <span className={cn("size-2 rounded-full", open ? "live-dot bg-market-up" : "bg-text-secondary/60")} aria-hidden="true" />
                <span className="font-semibold tracking-wide text-text-primary">{x}</span>
                {ex!.status && <span className="text-text-secondary">{open ? t.marketOpenShort : t.marketClosedShort}</span>}
              </span>
              {indices.length > 0 ? (
                <dl className="flex flex-col gap-1.5 font-mono text-[13px] tabular-nums">
                  {indices.map((i) => (
                    <div key={i.name} className="flex items-baseline justify-between gap-3">
                      <dt className="text-gold">{i.name}</dt>
                      <dd className="flex items-baseline gap-2">
                        <span className="text-text-primary">{fmt(locale, i.value)}</span>
                        <span className={cn("w-[4.5rem] text-right", i.changePct > 0 ? "text-market-up" : i.changePct < 0 ? "text-market-down" : "text-text-secondary")}>
                          {i.changePct > 0 ? "▲" : i.changePct < 0 ? "▼" : "•"} {fmt(locale, Math.abs(i.changePct), 2)}%
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                ex!.advancers !== undefined && (
                  <span className="font-mono text-[13px] tabular-nums">
                    <span className="text-market-up">▲ {fmt(locale, ex!.advancers, 0)}</span>{" "}
                    <span className="text-market-down">▼ {fmt(locale, ex!.decliners ?? 0, 0)}</span>{" "}
                    <span className="text-text-secondary">• {fmt(locale, ex!.unchanged ?? 0, 0)}</span>
                  </span>
                )
              )}
            </a>
          );
        })}
      </div>
      {data.mode === "demo" && <span className="demo-text text-xs font-semibold">{t.demoData}</span>}
    </div>
  );
}
