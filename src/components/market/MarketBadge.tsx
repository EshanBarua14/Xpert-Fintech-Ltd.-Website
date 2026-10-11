import type { MarketPayload } from "@/lib/market/types";
import type { Messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils/cn";
import { fill } from "@/lib/i18n/digits";

/** Live / delayed / demo label. Demo is loud on purpose, so no one mistakes it for real prices. */
export function MarketBadge({ data, t, className }: { data: MarketPayload; t: Messages; className?: string }) {
  if (data.mode === "demo") {
    return (
      <span className={cn("demo-text inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-400/15 px-3 py-1 text-xs font-semibold", className)}>
        <span className="size-1.5 rounded-full bg-amber-400" />
        {t.demoData}
      </span>
    );
  }
  const delayed = data.delayMinutes > 0;
  // "Live" only while an exchange is trading; otherwise say whose figures these are.
  const exchanges = data.snapshot?.exchanges ?? [];
  const trading = exchanges.some((e) => e.status === "OPEN" || e.status === "HALTED");
  const label = trading ? (delayed ? fill(t.delayedBy, { n: data.delayMinutes }) : t.live) : exchanges.length && exchanges.every((e) => e.lastSession) ? t.marketLastSession : t.marketTodayClose;
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border border-fg/10 bg-fg/[0.04] px-3 py-1 text-xs font-semibold text-text-secondary", className)}>
      <span className={cn("size-1.5 rounded-full", trading && !delayed ? "animate-pulse bg-market-up" : "bg-text-secondary")} />
      {label}
    </span>
  );
}
