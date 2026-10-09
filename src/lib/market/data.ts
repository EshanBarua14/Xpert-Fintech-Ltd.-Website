import "server-only";
import { db } from "@/lib/db/client";
import { demoSnapshot } from "./demo";
import { exchangeSnapshot } from "./exchange";
import { snapshotSchema } from "./schema";
import { uniqueQuotes, withSessions, type MarketPayload, type MarketSnapshot, type ShareFigure } from "./types";
import { DEFAULT_SESSIONS, readSchedule, tradedToday, type Sessions } from "./session";

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
let boardCache: { at: number; value: MarketSnapshot | null } | null = null;

/** How often prices refresh, in seconds (Admin → Market data). Server reads and browser polls both follow it. */
export const REFRESH_KEY = "market.refreshSeconds";
export const REFRESH_CHOICES = [15, 30, 60] as const;
export const DEFAULT_REFRESH = 30;
let refreshSeconds: number = DEFAULT_REFRESH;
const TTL = () => refreshSeconds * 1000;

let boardRefresh: Promise<MarketSnapshot | null> | null = null;

/** Reads both exchanges once (concurrent callers share the same request). */
function refreshBoard(): Promise<MarketSnapshot | null> {
  if (!boardRefresh) {
    boardRefresh = exchangeSnapshot()
      .then(({ snapshot }) => snapshot)
      .catch((error: unknown) => {
        console.error("[market] exchange read failed", error);
        return null;
      })
      .then((snapshot) => {
        if (snapshot) void recordTurnover(snapshot);
        // Keep the last good board if both exchanges fail this time.
        boardCache = { at: Date.now(), value: snapshot ?? boardCache?.value ?? null };
        return boardCache.value;
      })
      .finally(() => {
        boardRefresh = null;
      });
  }
  return boardRefresh;
}

/**
 * The exchanges' boards without making pages wait for DSE or CSE: a fresh copy
 * is returned at once; a stale one is returned at once while a new read runs in
 * the background; with nothing cached yet, the caller waits at most `waitMs`
 * (pages render without prices and the browser fills them in a moment later).
 */
async function boardSnapshot(waitMs = 1500): Promise<MarketSnapshot | null> {
  if (boardCache && Date.now() - boardCache.at < TTL()) return boardCache.value;
  const pending = refreshBoard();
  if (boardCache) return boardCache.value;
  return Promise.race([pending, new Promise<null>((r) => setTimeout(() => r(null), waitMs))]);
}

/** Calls the licensed feed adapter. Short cache so many visitors cause one upstream call. */
async function licensedSnapshot(): Promise<MarketSnapshot | null> {
  if (cache && Date.now() - cache.at < TTL()) return cache.value;
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
      const tradeDate = r.tradeDate.toISOString().slice(0, 10);
      // The exchange's own total for that day, when it was read from its page, over the one typed in.
      const official = await recordedTurnover(ex, tradeDate);
      const market = official ?? Number(r.marketTurnover);
      const xpert = Number(r.xpertTurnover);
      if (!(market > 0)) continue;
      out.push({
        exchange: ex,
        tradeDate,
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

// Admin settings and share figures change rarely: read them at most every 30 s
// (browsers poll /api/market at the refresh interval; saving in the admin clears this at once).
let infoCache: { at: number; value: Promise<{ source: Awaited<ReturnType<typeof db.marketDataSource.findFirst>>; shares: ShareFigure[]; averages: { DSE?: number; CSE?: number } }> } | null = null;
function settingsAndShares() {
  if (!infoCache || Date.now() - infoCache.at > 30_000) {
    infoCache = {
      at: Date.now(),
      value: Promise.all([
        db.marketDataSource.findFirst({ orderBy: { createdAt: "asc" } }).catch(() => null),
        latestShares(),
        db.siteSetting.findUnique({ where: { key: REFRESH_KEY } }).catch(() => null),
        db.siteSetting.findUnique({ where: { key: SESSIONS_KEY } }).catch(() => null),
        db.siteSetting.findUnique({ where: { key: "market.headlineShare" } }).catch(() => null),
      ]).then(([source, shares, refresh, sessionsRow, headline]) => {
        const v = Number((refresh?.value as { seconds?: unknown } | null)?.seconds);
        refreshSeconds = (REFRESH_CHOICES as readonly number[]).includes(v) ? v : DEFAULT_REFRESH;
        sessions = readSessions(sessionsRow?.value);
        const h = (headline?.value ?? {}) as Record<string, unknown>;
        const avg = (x: unknown) => (Number(x) > 0 && Number(x) <= 100 ? Number(x) : undefined);
        const averages = { DSE: avg(h.dse) ?? avg(h.pct), CSE: avg(h.cse) };
        return { source, shares, averages };
      }),
    };
  }
  return infoCache.value;
}

/** Trading hours and holidays per exchange (Admin → Market data → Trading hours). */
export const SESSIONS_KEY = "market.sessions";
let sessions: Sessions = DEFAULT_SESSIONS;
export function readSessions(v: unknown): Sessions {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  return { DSE: readSchedule(o.DSE), CSE: readSchedule(o.CSE) };
}

/**
 * The exchanges' official total turnover for each trading day, as read from
 * their own pages: kept (60 days) so a market-share figure entered later for
 * that day is worked out against the exchange's real total.
 */
export const TURNOVER_KEY = (ex: "DSE" | "CSE") => `market.turnover.${ex}`;
const lastRecorded: Record<string, number> = {};
async function recordTurnover(snapshot: MarketSnapshot) {
  for (const e of snapshot.exchanges) {
    const t = e.turnover;
    if (!(t && t > 0) || !tradedToday(sessions[e.exchange])) continue;
    const day = dhakaToday();
    const k = `${e.exchange}:${day}`;
    if (lastRecorded[k] === t) continue;
    lastRecorded[k] = t;
    try {
      const row = await db.siteSetting.findUnique({ where: { key: TURNOVER_KEY(e.exchange) } });
      const days = { ...((row?.value as Record<string, number> | null) ?? {}), [day]: t };
      const kept = Object.fromEntries(Object.entries(days).sort(([a], [b]) => b.localeCompare(a)).slice(0, 60));
      await db.siteSetting.upsert({ where: { key: TURNOVER_KEY(e.exchange) }, update: { value: kept }, create: { key: TURNOVER_KEY(e.exchange), value: kept } });
    } catch (error) {
      console.error("[market] could not record turnover", error);
    }
  }
}

/** The exchange's official turnover for a day, when it was read from its page that day. */
export async function recordedTurnover(exchange: "DSE" | "CSE", day: string): Promise<number | null> {
  const row = await db.siteSetting.findUnique({ where: { key: TURNOVER_KEY(exchange) } }).catch(() => null);
  const v = Number((row?.value as Record<string, unknown> | null)?.[day]);
  // A misread figure (outside a day's plausible range) is ignored rather than used for the share.
  return v >= 1e7 && v <= 5e11 ? v : null;
}

/** Forget cached settings and share figures (after an admin saves them). */
export function clearMarketInfoCache() {
  infoCache = null;
}

/**
 * What the site shows. Pages call it with the default short wait so a slow
 * exchange never delays them; /api/market (polled by browsers) waits longer.
 */
export async function getMarketPayload({ waitMs = 1500 }: { waitMs?: number } = {}): Promise<MarketPayload> {
  const mode = marketMode();
  const { source, shares, averages } = await settingsAndShares();
  let snapshot: MarketSnapshot | null = null;
  if (mode === "demo") snapshot = demoSnapshot();
  // A licensed feed is shown only once an admin switches it on in Admin → Market data.
  if (mode === "licensed" && source?.isActive) snapshot = await licensedSnapshot();
  // DSE/CSE public pages: MARKET_DATA_MODE=exchange alone switches them on.
  if (mode === "exchange") snapshot = await boardSnapshot(waitMs);
  // Every source: one row per symbol, so lists keyed by symbol never repeat one.
  if (snapshot) {
    snapshot = {
      ...snapshot,
      exchanges: snapshot.exchanges.map((e) => ({
        ...e,
        // What the exchange's page said; the status shown comes from the trading hours (withSessions).
        reported: e.reported ?? e.status,
        quotes: uniqueQuotes(e.quotes),
        ...(e.gainers && { gainers: uniqueQuotes(e.gainers) }),
        ...(e.losers && { losers: uniqueQuotes(e.losers) }),
      })),
    };
  }
  return withSessions({
    // "none" only when prices are really off; a board still loading keeps its
    // mode so the page's widgets go on to fetch it from /api/market.
    mode: snapshot || mode === "exchange" ? mode : "none",
    providerName: source?.providerName ?? (mode === "exchange" ? "DSE, CSE" : null),
    delayMinutes: source?.displayDelayMinutes ?? 0,
    snapshot,
    shares,
    refreshSeconds,
    sessions,
    averages,
  });
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
  if (mode === "exchange") snapshot = await boardSnapshot(12_000);
  else if (mode === "licensed") snapshot = await licensedSnapshot();
  // Before today's trading starts the exchange still shows the previous session's total: not today's.
  if (!tradedToday(sessions[exchange])) return null;
  const t = snapshot?.exchanges.find((e) => e.exchange === exchange)?.turnover;
  return t && t > 0 ? t : null;
}

/** Today's date in Dhaka as YYYY-MM-DD. */
export function dhakaToday(): string {
  return new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);
}
