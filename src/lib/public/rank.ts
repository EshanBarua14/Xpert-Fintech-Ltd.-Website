/** A brokerage's ranking among brokers on DSE / CSE (Admin → Organizations), when set. */
export type BrokerRank = { dse: number | null; cse: number | null; asOf: string | null; source: string | null };

export function rankOf(o: { dseRank?: number | null; cseRank?: number | null; rankAsOf?: string | null; rankSource?: string | null } | null | undefined): BrokerRank | null {
  if (!o || (o.dseRank == null && o.cseRank == null)) return null;
  return { dse: o.dseRank ?? null, cse: o.cseRank ?? null, asOf: o.rankAsOf ?? null, source: o.rankSource ?? null };
}

/** "#1 broker on DSE", in this language's digits. */
export function rankText(n: number, exchange: "DSE" | "CSE", template: string, locale: "en" | "bn") {
  const num = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(n);
  return template.replace("{n}", num).replace("{exchange}", exchange);
}
