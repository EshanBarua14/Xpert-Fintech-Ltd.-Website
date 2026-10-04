import "server-only";
import type { ExchangeSnapshot, IndexValue, MarketSnapshot, Quote } from "./types";

/*
 * Reads the public price boards of the Dhaka and Chittagong stock exchanges
 * (MARKET_DATA_MODE=exchange), under Xpert's market-data display licence.
 *
 *  - DSE: https://www.dse.com.bd/markets — the page carries a price strip of
 *    every listed company ("GP 287.30 ▲ +1.40 +0.49%"). DSE's robots.txt
 *    allows /markets and disallows /api, so only the page is read.
 *  - CSE: https://www.cse.com.bd/market/current_price — a price table, read by
 *    its column headings (code, LTP, YCP, change, volume); and the CSE home
 *    page (https://www.cse.com.bd/) for the market status, the five indices
 *    (CASPI, CSE30, CSCX, CSI, CSE50) and the day's trades, volume and value.
 *  - DSE index values (DSEX, DS30, DSES), turnover and trades are loaded on
 *    dse.com.bd through its /api, which DSE's robots.txt disallows, so they
 *    are not read; they need the licensed feed (MARKET_DATA_MODE=licensed).
 *
 * One request per exchange per minute at most, shared by all visitors. If an
 * exchange's page changes shape, that exchange is simply left out (and the
 * reason logged) — nothing is ever guessed. Replace with the licensed feed
 * (MARKET_DATA_MODE=licensed) when it is available.
 */

const DSE_URL = () => process.env.MARKET_DSE_URL || "https://www.dse.com.bd/markets";
const CSE_URL = () => process.env.MARKET_CSE_URL || "https://www.cse.com.bd/market/current_price";
const CSE_HOME_URL = () => process.env.MARKET_CSE_HOME_URL || "https://www.cse.com.bd/";
const CSE_INDEX_NAMES = ["CASPI", "CSE30", "CSCX", "CSI", "CSE50"] as const;
const USER_AGENT = "Mozilla/5.0 (compatible; XpertFintechWebsite/1.0; +https://www.xpertfintech.com)";

const decode = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8722;|&minus;/g, "−")
    .replace(/&#9650;/g, "▲")
    .replace(/&#9660;/g, "▼")
    .replace(/\s+/g, " ")
    .trim();

const num = (s: string | undefined) => {
  if (!s) return NaN;
  const v = Number(s.replace(/[,\s%]/g, "").replace(/[−–]/g, "-"));
  return Number.isFinite(v) ? v : NaN;
};

const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

/** DSE price strip: links to /company/CODE whose text is "CODE LTP ▲ ±change ±pct%". */
export function parseDseStrip(html: string): Quote[] {
  const out = new Map<string, Quote>();
  const link = /<a\b[^>]*href="[^"]*\/company\/([A-Z0-9][A-Z0-9&-]*)"[^>]*>([\s\S]*?)<\/a>/g;
  const pattern = /^([A-Z0-9&-]+)\s+([\d,]+(?:\.\d+)?)\s*([▲▼])?\s*([+\-−]?\s*[\d,]+(?:\.\d+)?)\s*([+\-−]?\s*[\d,]+(?:\.\d+)?)\s*%/;
  for (const m of html.matchAll(link)) {
    const code = m[1]!;
    const text = decode(m[2]!);
    const p = pattern.exec(text);
    if (!p || p[1] !== code) continue;
    const ltp = num(p[2]);
    let change = num(p[4]);
    let pct = num(p[5]);
    if (!(ltp > 0) || !Number.isFinite(change) || !Number.isFinite(pct)) continue;
    // The arrow carries the sign when the numbers are written without one.
    if (p[3] === "▼") {
      change = -Math.abs(change);
      pct = -Math.abs(pct);
    }
    out.set(code, { symbol: code, ltp, change: round(change), changePct: round(pct) });
  }
  return [...out.values()];
}

/** Any HTML price table, read by its headings (used for CSE, and as a DSE fallback). */
export function parsePriceTable(html: string): Quote[] {
  const rows = [...html.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((r) => [...r[0].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => decode(c[1]!)));
  const headerAt = rows.findIndex((cells) => cells.some((c) => /code|scrip|symbol|instrument/i.test(c)) && cells.some((c) => /^ltp|last/i.test(c)));
  if (headerAt < 0) return [];
  const head = rows[headerAt]!.map((c) => c.toLowerCase());
  const col = (re: RegExp, not?: RegExp) => head.findIndex((h) => re.test(h) && !(not && not.test(h)));
  const iCode = col(/code|scrip|symbol|instrument/);
  const iLtp = col(/^ltp|last/);
  const iYcp = col(/ycp|prev|yesterday|closep/);
  const iPct = col(/%/);
  const iChg = col(/change|chg/, /%/);
  const iVol = col(/volume/);
  const out = new Map<string, Quote>();
  for (const cells of rows.slice(headerAt + 1)) {
    const code = cells[iCode]?.replace(/\s+/g, "");
    const ltp = num(cells[iLtp]);
    if (!code || !/^[A-Z0-9&-]{1,24}$/.test(code) || !(ltp > 0)) continue;
    const ycp = iYcp >= 0 ? num(cells[iYcp]) : NaN;
    let change = iChg >= 0 ? num(cells[iChg]) : NaN;
    if (!Number.isFinite(change)) change = ycp > 0 ? ltp - ycp : 0;
    let pct = iPct >= 0 ? num(cells[iPct]) : NaN;
    if (!Number.isFinite(pct)) pct = ycp > 0 ? (change / ycp) * 100 : 0;
    const volume = iVol >= 0 ? num(cells[iVol]) : NaN;
    out.set(code, { symbol: code, ltp, change: round(change), changePct: round(pct), ...(volume >= 0 && { volume }) });
  }
  return [...out.values()];
}

export type CseSummary = {
  status?: ExchangeSnapshot["status"];
  indices: IndexValue[];
  turnover?: number;
  volume?: number;
  trades?: number;
  /** True when the figures are the previous session's (before today's trading starts). */
  previousSession: boolean;
};

/**
 * CSE home page: "Market Status: …", then one block per index:
 * "TODAY Index … % … Trade … Volume … Value … YESTERDAY Index … % … Trade … Volume … Value …".
 * Before the session starts TODAY is empty or zero, so YESTERDAY is used and flagged.
 * Read from the page text (not its markup), so styling changes do not break it.
 */
export function parseCseSummary(html: string): CseSummary {
  const text = decode(html);
  const n = String.raw`([+\-−]?[\d,]*\.?\d*)`;
  const block = new RegExp(
    String.raw`TODAY\s*Index\s*${n}\s*%\s*${n}\s*Trade\s*${n}\s*Volume\s*${n}\s*Value\s*${n}\s*YESTERDAY\s*Index\s*${n}\s*%\s*${n}\s*Trade\s*${n}\s*Volume\s*${n}\s*Value\s*${n}`,
    "gi",
  );
  const blocks = [...text.matchAll(block)];
  // Index names in the order the page lists them (its tabs); fall back to CSE's usual order.
  const named = [...text.matchAll(/\b(CASPI|CSE30|CSCX|CSI|CSE50)\b/g)].map((m) => m[1]!);
  const order = [...new Set(named)].length === blocks.length ? [...new Set(named)] : [...CSE_INDEX_NAMES];
  const today = blocks.some((b) => num(b[1]) > 0);
  const indices: IndexValue[] = [];
  blocks.forEach((b, i) => {
    const name = order[i];
    const value = today ? num(b[1]) : num(b[6]);
    const pct = today ? num(b[2]) : num(b[7]);
    if (!name || !(value > 0) || !Number.isFinite(pct)) return;
    const change = (value * pct) / (100 + pct);
    indices.push({ name, value: round(value, 2), change: round(change, 2), changePct: round(pct, 2) });
  });
  const first = blocks[0];
  const pick = (todayIdx: number, yIdx: number) => {
    if (!first) return undefined;
    const v = today ? num(first[todayIdx]) : num(first[yIdx]);
    return v > 0 ? v : undefined;
  };
  // The page's own summary line for today ("Value in Taka 1,234 … Contract Number 567").
  const valueToday = num(/Value in Taka\s*([\d,]+(?:\.\d+)?)/i.exec(text)?.[1]);
  const tradesToday = num(/Contract Number\s*([\d,]+)/i.exec(text)?.[1]);
  const statusText = /Market Status\s*:?\s*([A-Za-z -]{3,20}?)(?=\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)|\s{2}|$)/i.exec(text)?.[1]?.trim().toLowerCase() ?? "";
  const status: CseSummary["status"] = /pre|opening/.test(statusText)
    ? "PRE_OPEN"
    : /open|running|continuous/.test(statusText)
      ? "OPEN"
      : /halt|suspend/.test(statusText)
        ? "HALTED"
        : /clos|end|post/.test(statusText)
          ? "CLOSED"
          : undefined;
  return {
    status,
    indices,
    turnover: valueToday > 0 ? valueToday : pick(5, 10),
    volume: pick(4, 9),
    trades: tradesToday > 0 ? tradesToday : pick(3, 8),
    previousSession: !today && blocks.length > 0,
  };
}

function withBreadth(exchange: "DSE" | "CSE", quotes: Quote[]): ExchangeSnapshot {
  return {
    exchange,
    indices: [],
    quotes,
    advancers: quotes.filter((q) => q.changePct > 0).length,
    decliners: quotes.filter((q) => q.changePct < 0).length,
    unchanged: quotes.filter((q) => q.changePct === 0).length,
  };
}

async function getHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
    cache: "no-store",
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.text();
}

export type ExchangeReport = { exchange: "DSE" | "CSE"; ok: boolean; count: number; message: string };

/** Reads both boards. Returns what worked, plus a per-exchange report for the admin test. */
export async function exchangeSnapshot(): Promise<{ snapshot: MarketSnapshot | null; reports: ExchangeReport[] }> {
  const tasks: [("DSE" | "CSE"), () => Promise<Quote[]>][] = [
    [
      "DSE",
      async () => {
        const html = await getHtml(DSE_URL());
        const strip = parseDseStrip(html);
        return strip.length ? strip : parsePriceTable(html);
      },
    ],
    ["CSE", async () => parsePriceTable(await getHtml(CSE_URL()))],
  ];
  const [results, cse] = await Promise.all([
    Promise.allSettled(tasks.map(([, run]) => run())),
    getHtml(CSE_HOME_URL())
      .then(parseCseSummary)
      .catch((error: unknown) => {
        console.error("[market] CSE summary unavailable:", (error as Error)?.message ?? error);
        return null;
      }),
  ]);
  const exchanges: ExchangeSnapshot[] = [];
  const reports: ExchangeReport[] = [];
  results.forEach((r, i) => {
    const exchange = tasks[i]![0];
    if (r.status === "fulfilled" && r.value.length >= 5) {
      const snap = withBreadth(exchange, r.value);
      let extra = "";
      if (exchange === "CSE" && cse) {
        snap.indices = cse.indices;
        if (cse.status) snap.status = cse.status;
        // Totals belong to today's session only; yesterday's are not shown as today's.
        if (!cse.previousSession) Object.assign(snap, { turnover: cse.turnover, volume: cse.volume, trades: cse.trades });
        extra = `, ${cse.indices.length} indices${cse.previousSession ? " (previous session)" : ""}`;
      }
      exchanges.push(snap);
      reports.push({ exchange, ok: true, count: r.value.length, message: `${r.value.length} prices read${extra}` });
    } else {
      const message = r.status === "rejected" ? String((r.reason as Error)?.message ?? r.reason) : "page read, but no price list found (the page layout may have changed)";
      console.error(`[market] ${exchange} board unavailable: ${message}`);
      reports.push({ exchange, ok: false, count: 0, message });
    }
  });
  return { snapshot: exchanges.length ? { asOf: new Date().toISOString(), exchanges } : null, reports };
}
