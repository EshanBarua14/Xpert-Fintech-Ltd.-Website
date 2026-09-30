import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "brand" | "up" | "down";

const tones: Record<Tone, string> = {
  neutral: "border-fg/15 text-text-secondary",
  brand: "border-brand-sky/40 text-brand-sky",
  up: "border-market-up/40 text-market-up",
  down: "border-market-down/40 text-market-down",
};

/** Small status label. `up` / `down` are reserved for market data. */
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
