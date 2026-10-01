"use client";

import type { MarketPayload } from "@/lib/market/types";
import type { Messages } from "@/lib/i18n/messages";
import { fmt, signed } from "@/lib/market/format";
import { cn } from "@/lib/utils/cn";
import { useMarket } from "./useMarket";

/** One line above the hero headline: each exchange's status and main index, live. */
export function MarketStatusLine({ initial, t, locale }: { initial: MarketPayload; t: Messages; locale: "en" | "bn" }) {
  const { data } = useMarket(initial);
  const exchanges = data.snapshot?.exchanges ?? [];
  if (!exchanges.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {exchanges.map((ex) => {
        const idx = ex.indices[0];
        const open = ex.status === "OPEN";
        return (
          <span key={ex.exchange} className="inline-flex items-center gap-2.5 rounded-full border border-fg/10 bg-fg/[0.03] py-1.5 pr-3.5 pl-3 text-sm">
            <span className={cn("size-2 rounded-full", open || (!ex.status && data.mode !== "none") ? "live-dot bg-gold" : "bg-text-secondary/60")} />
            <span className="font-semibold text-text-primary">
              {ex.exchange} {ex.status ? (open ? t.marketOpenShort : t.marketClosedShort) : ""}
            </span>
            {!idx && ex.advancers !== undefined && (
              <span className="font-mono text-[13px] tabular-nums">
                <span className="text-market-up">▲ {fmt(locale, ex.advancers, 0)}</span>{" "}
                <span className="text-market-down">▼ {fmt(locale, ex.decliners ?? 0, 0)}</span>
              </span>
            )}
            {idx && (
              <span className="font-mono text-[13px] tabular-nums text-text-secondary">
                {idx.name} {fmt(locale, idx.value)}{" "}
                <span className={idx.changePct > 0 ? "text-market-up" : idx.changePct < 0 ? "text-market-down" : ""}>{signed(locale, idx.changePct, 2, "%")}</span>
              </span>
            )}
          </span>
        );
      })}
      {data.mode === "demo" && <span className="demo-text text-xs font-semibold">{t.demoData}</span>}
    </div>
  );
}
