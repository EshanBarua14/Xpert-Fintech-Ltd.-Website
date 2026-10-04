import "server-only";
import { db } from "@/lib/db/client";
import { demoSnapshot } from "./demo";
import { exchangeSnapshot } from "./exchange";
import { snapshotSchema } from "./schema";
import type { MarketPayload, MarketSnapshot, ShareFigure } from "./types";

type Mode = MarketPayload["mode"];

/**
 * MARKET_DATA_MODE: none | exchange | licensed | demo.
 *  - exchange: read the DSE and CSE public price boards (see ./exchange.ts)
 *  - licensed: the feed at MARKET_DATA_API_URL
 *  - demo: generated prices, blocked in production unless explicitly allowed
 */
export function marketMode(): Mode {
  const raw = (process.env.MARKET_DATA_MODE ?? "none").toLowerCase();
  if (raw === "licensed") return "licensed";
  if (raw === "exchange") return "exchange";
  if (raw === "demo") {
    const prod = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
    if (prod && process.env.ALLOW_DEMO_MARKET_DATA !== "true") {
      console.error("[market] demo market data is not allowed in production; showing none");
      return "none";
    }
    return "demo";
  }
  return "none";
}

let cache: { at: number; value: MarketSnapshot | null } | null = null;
const TTL_MS = 15_000;
let boardCache: { at: number; value: MarketSnapshot | null } | null = null;
const BOARD_TTL_MS = 60_000; // be a polite reader: at most one request per exchange per minute

async function boardSnapshot(): Promise<MarketSnapshot | null> {
  if (boardCache && Date.now() - boardCache.at < BOARD_TTL_MS) return boardCache.value;
  const { snapshot } = await exchangeSnapshot();
  // Keep the last good board if both exchanges fail this time.
  boardCache = { at: Date.now(), value: snapshot ?? boardCache?.value ?? null };
  return boardCache.value;
}

/** Calls the licensed feed adapter. Short cache so many visitors cause one upstream call. */
async function licensedSnapshot(): Promise<MarketSnapshot | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const url = process.env.MARKET_DATA_API_URL;
  if (!url) return null;
  let value: MarketSnapshot | null = null;
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const key = process.env.MARKET_DATA_API_KEY;
    if (key) headers[process.env.MARKET_DATA_API_KEY_HEADER || "Authorization"] = process.env.MARKET_DATA_API_KEY_HEADER ? key : `Bearer ${key}`;
    const res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = snapshotSchema.safeParse(await res.json());
    if (!parsed.success) throw new Error(`Unexpected feed format: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`);
    value = parsed.data;
  } catch (error) {
    console.error("[market] feed unavailable", error);
    value = cache?.value ?? null; // keep showing the last good snapshot
  }
  cache = { at: Date.now(), value };
  return value;
}

/** Latest published market-share figure for each exchange. */
export async function latestShares(): Promise<ShareFigure[]> {
  try {
    const rows = await db.marketShare.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { tradeDate: "desc" },
      take: 20,
    });
    const out: ShareFigure[] = [];
    for (const ex of ["DSE", "CSE"] as const) {
      const r = rows.find((x) => x.exchange === ex);
      if (!r) continue;
      const market = Number(r.marketTurnover);
      const xpert = Number(r.xpertTurnover);
      if (!(market > 0)) continue;
      out.push({
        exchange: ex,
        tradeDate: r.tradeDate.toISOString().slice(0, 10),
        sharePct: (xpert / market) * 100,
        xpertTurnover: xpert,
        marketTurnover: market,
        sourceNote: r.sourceNote,
      });
    }
    return out;
  } catch (error) {
    console.error("[market] could not load market share", error);
    return [];
  }
}

export async function getMarketPayload(): Promise<MarketPayload> {
  const mode = marketMode();
  const [source, shares] = await Promise.all([
    db.marketDataSource.findFirst({ orderBy: { createdAt: "asc" } }).catch(() => null),
    latestShares(),
  ]);
  let snapshot: MarketSnapshot | null = null;
  if (mode === "demo") snapshot = demoSnapshot();
  // A licensed feed is shown only once an admin switches it on in Admin → Market data.
  if (mode === "licensed" && source?.isActive) snapshot = await licensedSnapshot();
  // DSE/CSE public pages: MARKET_DATA_MODE=exchange alone switches them on.
  if (mode === "exchange") snapshot = await boardSnapshot();
  return {
    mode: snapshot ? mode : "none",
    providerName: source?.providerName ?? (mode === "exchange" ? "DSE, CSE" : null),
    delayMinutes: source?.displayDelayMinutes ?? 0,
    snapshot,
    shares,
  };
}

/** For the admin "test connection" button. */
export async function testFeed(): Promise<{ ok: boolean; message: string }> {
  if (marketMode() === "exchange") {
    const { reports } = await exchangeSnapshot();
    boardCache = null;
    return {
      ok: reports.some((r) => r.ok),
      message: reports.map((r) => `${r.exchange}: ${r.ok ? "OK" : "not available"} — ${r.message}`).join(" · "),
    };
  }
  if (!process.env.MARKET_DATA_API_URL) return { ok: false, message: "MARKET_DATA_API_URL is not set in the server's .env." };
  cache = null;
  const snap = await licensedSnapshot();
  if (!snap) return { ok: false, message: "The feed did not return valid data. See the server log for the reason." };
  const q = snap.exchanges.reduce((n, e) => n + e.quotes.length, 0);
  return { ok: true, message: `Connected. ${snap.exchanges.map((e) => e.exchange).join(" and ")}, ${q} quotes, as of ${snap.asOf}.` };
}

/**
 * Today's total turnover of an exchange from the live source, when it reports
 * one: CSE's home page in exchange mode, or the licensed feed. Used to fill
 * in the market side of the daily market-share figure. Null when unknown.
 */
export async function liveMarketTurnover(exchange: "DSE" | "CSE"): Promise<number | null> {
  const mode = marketMode();
  let snapshot: MarketSnapshot | null = null;
  if (mode === "exchange") snapshot = await boardSnapshot();
  else if (mode === "licensed") snapshot = await licensedSnapshot();
  const t = snapshot?.exchanges.find((e) => e.exchange === exchange)?.turnover;
  return t && t > 0 ? t : null;
}

/** Today's date in Dhaka as YYYY-MM-DD. */
export function dhakaToday(): string {
  return new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);
}
