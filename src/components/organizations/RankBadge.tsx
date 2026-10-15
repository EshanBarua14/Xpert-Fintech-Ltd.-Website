import { rankText, type BrokerRank } from "@/lib/public/rank";
import { cn } from "@/lib/utils/cn";

export type RankLabels = { broker: string; asOf: string; source: string };

/**
 * A brokerage's ranking among brokers ("#1 broker on DSE"), with when and
 * where it comes from: in the tooltip, or written out with `detailed`.
 */
export function RankBadge({ rank, labels, locale, detailed = false, className }: { rank: BrokerRank; labels: RankLabels; locale: "en" | "bn"; detailed?: boolean; className?: string }) {
  const parts = [rank.dse != null && rankText(rank.dse, "DSE", labels.broker, locale), rank.cse != null && rankText(rank.cse, "CSE", labels.broker, locale)].filter(Boolean) as string[];
  const note = [rank.asOf && labels.asOf.replace("{date}", rank.asOf), rank.source && `${labels.source}: ${rank.source}`].filter(Boolean).join(" · ");
  return (
    <span className={cn("flex flex-col items-start gap-1", className)}>
      <span className="flex flex-wrap gap-1.5">
        {parts.map((p) => (
          <span key={p} title={note || undefined} className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="currentColor"><path d="M8 1.5l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.3l-3.8 2 .7-4.3-3.1-3 4.3-.6L8 1.5Z" /></svg>
            {p}
          </span>
        ))}
      </span>
      {detailed && note && <span className="text-xs text-text-secondary">{note}</span>}
    </span>
  );
}
