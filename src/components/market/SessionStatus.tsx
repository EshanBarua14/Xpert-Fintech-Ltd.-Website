import type { ExchangeSnapshot } from "@/lib/market/types";
import { cn } from "@/lib/utils/cn";

type Phase = NonNullable<ExchangeSnapshot["status"]>;

/**
 * Colours of the trading session, the same everywhere (ticker, hero, market
 * cards, price boards): open green, pre-opening amber, post-closing violet,
 * closed red, halted orange. The dot pulses only while trading is open.
 */
export const SESSION_TONE: Record<Phase, { dot: string; text: string; ring: string }> = {
  OPEN: { dot: "bg-market-up live-dot", text: "text-market-up", ring: "border-market-up/40 bg-market-up/10" },
  PRE_OPEN: { dot: "bg-[#f59e0b]", text: "text-[#fbbf24] light:text-[#b45309]", ring: "border-[#f59e0b]/40 bg-[#f59e0b]/10" },
  POST_CLOSE: { dot: "bg-[#8b5cf6]", text: "text-[#c4b5fd] light:text-[#6d28d9]", ring: "border-[#8b5cf6]/40 bg-[#8b5cf6]/10" },
  CLOSED: { dot: "bg-market-down", text: "text-market-down", ring: "border-market-down/35 bg-market-down/10" },
  HALTED: { dot: "bg-[#f97316]", text: "text-[#fdba74] light:text-[#c2410c]", ring: "border-[#f97316]/40 bg-[#f97316]/10" },
};

export function SessionDot({ status, className }: { status?: ExchangeSnapshot["status"]; className?: string }) {
  return <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", status ? SESSION_TONE[status].dot : "bg-text-secondary/50", className)} />;
}

/** Dot and label; `pill` puts them in a tinted capsule. */
export function SessionStatus({ status, label, pill, className }: { status?: ExchangeSnapshot["status"]; label: string; pill?: boolean; className?: string }) {
  const tone = status ? SESSION_TONE[status] : null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-semibold", tone?.text ?? "text-text-secondary", pill && cn("rounded-full border px-2.5 py-1 text-xs", tone?.ring ?? "border-fg/10"), className)}>
      <SessionDot status={status} className={pill ? "size-1.5" : undefined} />
      {label}
    </span>
  );
}
