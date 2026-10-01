import "server-only";
import type { ExchangeSnapshot, MarketSnapshot, Quote } from "./types";

/*
 * Reads the public price boards of the Dhaka and Chittagong stock exchanges
 * (MARKET_DATA_MODE=exchange), under Xpert's market-data display licence.
 *
 *  - DSE: https://www.dse.com.bd/markets — the page carries a price strip of
 *    every listed company ("GP 287.30 ▲ +1.40 +0.49%"). DSE's robots.txt
 *    allows /markets and disallows /api, so only the page is read.
 *  - CSE: https://www.cse.com.bd/market/current_price — a price table, read by
 *    its column headings (code, LTP, YCP, change, volume).
 *
 * One request per exchange per minute at most, shared by all visitors. If an
 * exchange's page changes shape, that exchange is simply left out (and the
 * reason logged) — nothing is ever guessed. Replace with the licensed feed
 * (MARKET_DATA_MODE=licensed) when it is available.
 */

const DSE_URL = () => process.env.MARKET_DSE_URL || "https://www.dse.com.bd/markets";
const CSE_URL = () => process.env.MARKET_CSE_URL || "https://www.cse.com.bd/market/current_price";
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
  const results = await Promise.allSettled(tasks.map(([, run]) => run()));
  const exchanges: ExchangeSnapshot[] = [];
  const reports: ExchangeReport[] = [];
  results.forEach((r, i) => {
    const exchange = tasks[i]![0];
    if (r.status === "fulfilled" && r.value.length >= 5) {
      exchanges.push(withBreadth(exchange, r.value));
      reports.push({ exchange, ok: true, count: r.value.length, message: `${r.value.length} prices read` });
    } else {
      const message = r.status === "rejected" ? String((r.reason as Error)?.message ?? r.reason) : "page read, but no price list found (the page layout may have changed)";
      console.error(`[market] ${exchange} board unavailable: ${message}`);
      reports.push({ exchange, ok: false, count: 0, message });
    }
  });
  return { snapshot: exchanges.length ? { asOf: new Date().toISOString(), exchanges } : null, reports };
}
