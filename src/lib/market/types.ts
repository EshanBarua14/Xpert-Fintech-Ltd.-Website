/**
 * Market data shapes shared by the server and the browser widgets.
 * The feed format is validated in ./schema.ts (server only).
 */
import { DEFAULT_SESSIONS, phaseAt, type Sessions } from "./session";
export type Quote = { symbol: string; ltp: number; change: number; changePct: number; volume?: number };
export type IndexValue = { name: string; value: number; change: number; changePct: number };
export type ExchangeSnapshot = {
  exchange: "DSE" | "CSE";
  /** The session now, from the Dhaka clock and the trading hours (see ./session.ts). */
  status?: "OPEN" | "CLOSED" | "PRE_OPEN" | "POST_CLOSE" | "HALTED";
  /** What the exchange's own page said, when it said anything. */
  reported?: "OPEN" | "CLOSED" | "PRE_OPEN" | "POST_CLOSE" | "HALTED";
  indices: IndexValue[];
  /** Set when the index values are an earlier session's close (YYYY-MM-DD), not today's. */
  indicesAsOf?: string;
  turnover?: number;
  volume?: number;
  trades?: number;
  advancers?: number;
  decliners?: number;
  unchanged?: number;
  quotes: Quote[];
  gainers?: Quote[];
  losers?: Quote[];
};
export type MarketSnapshot = { asOf: string; exchanges: ExchangeSnapshot[] };
export type ShareFigure = {
  exchange: "DSE" | "CSE";
  tradeDate: string; // YYYY-MM-DD
  sharePct: number;
  xpertTurnover: number;
  marketTurnover: number;
  sourceNote: string | null;
};

/** What the public site receives. */
export type MarketPayload = {
  mode: "licensed" | "exchange" | "demo" | "none";
  providerName: string | null;
  delayMinutes: number;
  snapshot: MarketSnapshot | null;
  shares: ShareFigure[];
  /** Seconds between refreshes (Admin → Market data); browsers poll at this pace. */
  refreshSeconds?: number;
  /** Trading hours and holidays (Admin → Market data), so browsers keep the status right between refreshes. */
  sessions?: Sessions;
  /** Xpert's daily average share of each exchange's turnover, in % (Admin → Market data). */
  averages?: { DSE?: number; CSE?: number };
};

/** The payload with each exchange's status worked out for this moment. */
export function withSessions(p: MarketPayload, at: Date = new Date()): MarketPayload {
  if (!p.snapshot) return p;
  const sessions = p.sessions ?? DEFAULT_SESSIONS;
  return {
    ...p,
    snapshot: {
      ...p.snapshot,
      exchanges: p.snapshot.exchanges.map((e) => ({ ...e, status: phaseAt(sessions[e.exchange], at, e.reported) })),
    },
  };
}

/** Top movers: from the feed when given, otherwise computed from the quotes. */
export function movers(ex: ExchangeSnapshot, n = 5) {
  const sorted = [...ex.quotes].sort((a, b) => b.changePct - a.changePct);
  return {
    gainers: (ex.gainers ?? sorted.filter((q) => q.changePct > 0)).slice(0, n),
    losers: (ex.losers ?? [...sorted].reverse().filter((q) => q.changePct < 0)).slice(0, n),
  };
}

/** One entry per symbol (the first wins): exchange pages can list a stock twice. */
export function uniqueQuotes(rows: Quote[]): Quote[] {
  const seen = new Set<string>();
  return rows.filter((q) => {
    const k = q.symbol.trim().toUpperCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** The three indices shown for each exchange (hero, cards), in this order. */
export const INDEX_SLOTS = { DSE: ["DSEX", "DSES", "DS30"], CSE: ["CASPI", "CSE30", "CSCX"] } as const;
