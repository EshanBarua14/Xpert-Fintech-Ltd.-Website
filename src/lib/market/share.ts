import "server-only";
import { db } from "@/lib/db/client";
import { dhakaToday, liveMarketTurnover, recordedTurnover } from "./data";

export type ShareInput = {
  exchange: "DSE" | "CSE";
  xpertTurnover: number;
  marketTurnover?: number | null;
  /** Share in %, when Xpert's turnover in taka is not known: Xpert turnover = market total × share. */
  sharePct?: number | null;
};
export type ShareResult = { exchange: "DSE" | "CSE"; ok: boolean; sharePct?: number; marketTurnover?: number; message: string };

/**
 * Saves the day's market-share figures (one per exchange), replacing any
 * figure already saved for that day. When the market's total turnover is not
 * given for today, it is taken from the live source when it reports one
 * (CSE's home page, or the licensed feed); otherwise that exchange is refused.
 */
export async function saveShares(tradeDate: string, inputs: ShareInput[], sourceNote: string | null, adminId: string | null): Promise<ShareResult[]> {
  const day = new Date(`${tradeDate}T00:00:00Z`);
  const results: ShareResult[] = [];
  for (let f of inputs) {
    let market = f.marketTurnover ?? null;
    let note = sourceNote;
    // The exchange's own total for the day, read from its page, always wins over a typed figure.
    const official = (await recordedTurnover(f.exchange, tradeDate)) ?? (tradeDate === dhakaToday() ? await liveMarketTurnover(f.exchange) : null);
    if (official) {
      market = official;
      note = [sourceNote, `market turnover from ${f.exchange}`].filter(Boolean).join("; ");
    }
    if (!(market && market > 0)) {
      results.push({ exchange: f.exchange, ok: false, message: `${f.exchange}: enter the exchange's total turnover (it is not available from the live data for this day).` });
      continue;
    }
    if (f.sharePct != null) f = { ...f, xpertTurnover: Math.round(market * f.sharePct) / 100 };
    if (!(f.xpertTurnover >= 0) || f.xpertTurnover > market) {
      results.push({ exchange: f.exchange, ok: false, message: `${f.exchange}: Xpert turnover must be between 0 and the market's total.` });
      continue;
    }
    const data = { xpertTurnover: f.xpertTurnover.toFixed(2), marketTurnover: market.toFixed(2), sourceNote: note, status: "PUBLISHED" as const };
    await db.marketShare.upsert({
      where: { tradeDate_exchange: { tradeDate: day, exchange: f.exchange } },
      update: data,
      create: { tradeDate: day, exchange: f.exchange, createdById: adminId, ...data },
    });
    const sharePct = (f.xpertTurnover / market) * 100;
    results.push({ exchange: f.exchange, ok: true, sharePct, marketTurnover: market, message: `${f.exchange} ${tradeDate}: ${sharePct.toFixed(2)}%` });
  }
  return results;
}
