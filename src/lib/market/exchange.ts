import "server-only";
import { uniqueQuotes, type ExchangeSnapshot, type IndexValue, type MarketSnapshot, type Quote } from "./types";
import { getWithCompletedChain, isChainError } from "./fetch-chain";

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
 *  - DSE index values (DSEX, DSES, DS30), market status, trades, volume and
 *    turnover come from the text of DSE's long-standing site, which moved to
 *    old.dsebd.org in September 2026 when www.dsebd.org started redirecting to
 *    the new site; its full price table (latest_share_price_scroll_l.php) is
 *    the fallback when the dse.com.bd strip cannot be read. On the new site
 *    the live index figures are filled in by script from /api (not read), so
 *    when the old site is gone the day-end table on
 *    dse.com.bd/recent-market-information gives the latest closed session's
 *    indices and totals, marked as the previous session.
 *
 * One request per exchange per minute at most, shared by all visitors. If an
 * exchange's page changes shape, that exchange is simply left out (and the
 * reason logged) — nothing is ever guessed. Replace with the licensed feed
 * (MARKET_DATA_MODE=licensed) when it is available.
 */

const DSE_URL = () => process.env.MARKET_DSE_URL || "https://www.dse.com.bd/markets";
/** DSE's long-standing site: a full price table and the index/turnover summary on its home page. */
/** www.dsebd.org now redirects to the new site's home page: an address copied into .env before the move is read from old.dsebd.org. */
const legacyDse = (url: string) => url.replace(/^https?:\/\/(www\.)?dsebd\.org\//i, "https://old.dsebd.org/");
const DSE_TABLE_URL = () => legacyDse(process.env.MARKET_DSE_TABLE_URL || "https://old.dsebd.org/latest_share_price_scroll_l.php");
const DSE_HOME_URL = () => legacyDse(process.env.MARKET_DSE_HOME_URL || "https://old.dsebd.org/");
/** The new DSE site's day-end table: date, trades, volume, turnover (mn), DSEX, DSES, DS30 per session. */
const DSE_RECENT_URL = () => process.env.MARKET_DSE_RECENT_URL || "https://www.dse.com.bd/recent-market-information";
const DSE_INDEX_NAMES = ["DSEX", "DSES", "DS30"] as const;
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

/**
 * DSE price strip: links to /company/CODE whose text is "CODE LTP ▲ ±change ±pct%"
 * (with or without spaces between the parts; ▬ marks an unchanged price). The
 * code is taken from the link, so codes ending in digits are not confused with the price.
 */
export function parseDseStrip(html: string): Quote[] {
  const out = new Map<string, Quote>();
  const link = /<a\b[^>]*href="[^"]*\/company\/([A-Z0-9][A-Z0-9&-]*)\/?(?:[?#][^"]*)?"[^>]*>([\s\S]*?)<\/a>/g;
  const rest = /^\s*([\d,]+(?:\.\d+)?)\s*([▲▼▬▬=])?\s*([+\-−]?\s*[\d,]+(?:\.\d+)?)\s*([+\-−]?\s*[\d,]+(?:\.\d+)?)\s*%/;
  for (const m of html.matchAll(link)) {
    const code = m[1]!;
    const text = decode(m[2]!.replace(/&amp;/g, "&")).replace(/&#x25B2;|&#x25b2;/g, "▲").replace(/&#x25BC;|&#x25bc;/g, "▼");
    if (!text.startsWith(code)) continue;
    const p = rest.exec(text.slice(code.length));
    if (!p) continue;
    const ltp = num(p[1]);
    let change = num(p[3]);
    let pct = num(p[4]);
    if (!(ltp > 0) || !Number.isFinite(change) || !Number.isFinite(pct)) continue;
    // The arrow carries the sign when the numbers are written without one.
    if (p[2] === "▼") {
      change = -Math.abs(change);
      pct = -Math.abs(pct);
    }
    out.set(code, { symbol: code, ltp, change: round(change), changePct: round(pct) });
  }
  return [...out.values()];
}

/**
 * dse.com.bd/recent-market-information: one row per session, newest first —
 * Date | Total Trades | Total Volume | Turnover (mn) | Market Cap… | DSEX | DSES | DS30 | DGEN.
 * Gives the latest session's indices (change against the session before),
 * trades, volume and turnover, and the session's date.
 */
export function parseDseRecent(html: string): (DseSummary & { date: string }) | null {
  // Cells, with a colspan cell counted as that many columns.
  const rows = [...html.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((r) =>
    [...r[0].matchAll(/<t[hd]\b([^>]*)>([\s\S]*?)<\/t[hd]>/gi)].flatMap((c) => {
      const span = Math.min(6, Math.max(1, Number(/colspan\s*=\s*["']?(\d+)/i.exec(c[1]!)?.[1] ?? 1)));
      return [decode(c[2]!), ...Array<string>(span - 1).fill("")];
    }),
  );
  const headAt = rows.findIndex((c) => c.some((x) => /^date$/i.test(x)) && c.some((x) => /^DSEX$/i.test(x)));
  if (headAt < 0) return null;
  const head = rows[headAt]!;
  const col = (re: RegExp) => head.findIndex((h) => re.test(h));
  const iDate = col(/^date$/i);
  const iTrades = col(/trade/i);
  const iVol = col(/volume/i);
  const iTurn = col(/turnover|value/i);
  const data = rows.slice(headAt + 1).filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(c[iDate] ?? ""));
  const [latest, before] = data;
  if (!latest) return null;
  // The index columns are the last ones: when a row has more cells than the heading
  // (e.g. two market-cap cells under one heading), count them from the right.
  const shift = (row: string[], i: number) => (i > iTurn && row.length !== head.length ? i + row.length - head.length : i);
  // Plausible ranges, so a misread column is left out rather than shown.
  const RANGE: Record<string, [number, number]> = { DSEX: [1000, 50000], DSES: [100, 20000], DS30: [300, 20000] };
  const indices: IndexValue[] = [];
  for (const name of DSE_INDEX_NAMES) {
    const i = col(new RegExp(`^${name}$`, "i"));
    const value = i < 0 ? NaN : num(latest[shift(latest, i)]);
    const [lo, hi] = RANGE[name]!;
    if (!(value >= lo && value <= hi)) continue;
    const prev = before ? num(before[shift(before, i)]) : NaN;
    const change = prev > 0 ? value - prev : 0;
    indices.push({ name, value: round(value), change: round(change), changePct: prev > 0 ? round((change / prev) * 100) : 0 });
  }
  const trades = num(latest[iTrades]);
  const volume = num(latest[iVol]);
  const turnover = num(latest[iTurn]) * 1_000_000;
  return {
    date: latest[iDate]!,
    indices,
    ...(trades > 0 && { trades }),
    ...(volume > 0 && { volume }),
    ...(turnover > 0 && { turnover: Math.round(turnover) }),
  };
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
  // Yesterday's close: prefer YCP / previous over today's CLOSEP when both are present.
  const iYcp = col(/ycp|prev|yesterday/) >= 0 ? col(/ycp|prev|yesterday/) : col(/closep/);
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

/**
 * One index from page text, in the layouts DSE has used: "DSEX Index 5,123.45 12.34 0.24%",
 * "DSEX 5,123.45 ▼ 12.34 (0.24%)", "DSEX: 5123.45 -12.34 -0.24 %". When the page shows the
 * direction only by colour, the raw HTML right after the name decides the sign.
 */
function findIndex(text: string, name: string, html: string): IndexValue | null {
  const re = new RegExp(
    String.raw`\b${name}\b(?:\s*Index)?(?:[^\d]|\b\d{1,2}\b(?![.,]\d)){0,30}?(\d{1,3}(?:,\d{3})+\.\d+|\d{3,}\.\d+)[^\d+\-−▲▼]{0,15}?([+\-−▲▼]?\s*[\d,]*\.?\d+)[^\d+\-−▲▼]{0,15}?\(?\s*([+\-−▲▼]?\s*[\d.]+)\s*\)?\s*%`,
    "g",
  );
  for (const m of text.matchAll(re)) {
    const value = num(m[1]);
    const signed = (s: string | undefined) => num(s?.replace("▲", "").replace("▼", "-"));
    let change = signed(m[2]);
    let pct = signed(m[3]);
    if (!(value > 100) || !Number.isFinite(change) || !Number.isFinite(pct) || Math.abs(pct) > 20) continue;
    const down = change < 0 || pct < 0 || /▼/.test(m[2] ?? "") || /▼/.test(m[3] ?? "");
    let negative = down;
    if (!down && change !== 0) {
      // Direction by colour only: look at the classes just after the name in the HTML.
      const at = html.search(new RegExp(String.raw`\b${name}\b`));
      // Up to the next index name, so a neighbour's colour is not read as this one's.
      let near = at >= 0 ? html.slice(at + name.length, at + 700) : "";
      const next = near.search(/\b(DSEX|DSES|DS30|CASPI|CSE30|CSCX)\b/);
      if (next >= 0) near = near.slice(0, next);
      negative = /class="[^"]*\b(down|red|negative|minus|loss|decrease|danger)\b/i.test(near) && !/class="[^"]*\b(up|green|positive|plus|gain|increase|success)\b/i.test(near);
    }
    if (negative) {
      change = -Math.abs(change);
      pct = -Math.abs(pct);
    }
    return { name, value: round(value), change: round(change), changePct: round(pct) };
  }
  return null;
}

export type DseSummary = { status?: ExchangeSnapshot["status"]; indices: IndexValue[]; turnover?: number; volume?: number; trades?: number };

/**
 * DSE home page (old.dsebd.org): "DSEX Index 5,123.45 12.34 0.24%", the same for
 * DSES and DS30, then "Total Trade …", "Total Volume …", "Total Value in Taka (mn) …"
 * and "Market Status: Open/Closed". Read from the page text, so styling changes
 * do not break it; anything not found is simply left out.
 */
export function parseDseSummary(html: string): DseSummary {
  const text = decode(html);
  const indices: IndexValue[] = [];
  for (const name of DSE_INDEX_NAMES) {
    const found = findIndex(text, name, html);
    if (found) indices.push(found);
  }
  // old.dsebd.org: the three headings first, then the three values
  // ("Total Trade Total Volume Total Value in Taka (mn) 172590 174532023 5332.06").
  const row = /Total\s*Trades?\s*Total\s*Volume\s*Total\s*Value\s*in\s*Taka\s*\(?\s*mn\s*\)?\s*([\d,]+)\s+([\d,]+)\s+([\d,]+(?:\.\d+)?)/i.exec(text);
  // Older layout: each heading followed by its own value ("Total Trade 172590 Total Volume …").
  let trades = num(row?.[1] ?? /Total\s*Trades?\s*:?\s*([\d,]+)/i.exec(text)?.[1]);
  let volume = num(row?.[2] ?? /Total\s*Volume\s*:?\s*([\d,]+)/i.exec(text)?.[1]);
  let turnover = num(row?.[3] ?? /Total\s*Value\s*in\s*Taka\s*\(?\s*mn\s*\)?\s*:?\s*([\d,]+(?:\.\d+)?)/i.exec(text)?.[1]) * 1_000_000;
  // dse.com.bd: "Turnover BDT 5,332.06 mn Volume 174,532,023 Trades 172,590" (read near "Turnover").
  const tm = /\bTurnover\s*:?\s*(?:BDT|Tk\.?|৳)?\s*([\d,]+(?:\.\d+)?)\s*(mn|million|cr|crore|bn|billion)?/i.exec(text);
  if (tm && !(turnover > 0)) {
    const unit = (tm[2] ?? "").toLowerCase();
    const mult = unit.startsWith("m") ? 1e6 : unit.startsWith("c") ? 1e7 : unit.startsWith("b") ? 1e9 : 1;
    turnover = num(tm[1]) * mult;
  }
  const near = tm ? text.slice(tm.index, tm.index + 240) : "";
  if (!(volume > 0)) volume = num(/\bVolume\s*:?\s*([\d,]{4,})/i.exec(near)?.[1]);
  if (!(trades > 0)) trades = num(/\bTrades?\s*:?\s*([\d,]{3,})/i.exec(near)?.[1]);
  // A day's DSE turnover is in the hundreds of millions to hundreds of billions of taka: anything else is a misread.
  if (!(turnover >= 1e8 && turnover <= 5e11)) turnover = NaN;
  const statusText = (/Market\s*Status\s*:?\s*([A-Za-z-]+)/i.exec(text)?.[1] ?? /●\s*(Closed|Halted|Suspended|Pre-?open\w*|Post-?clos\w*)/i.exec(text)?.[1] ?? "").toLowerCase();
  const status: DseSummary["status"] = /pre/.test(statusText) ? "PRE_OPEN" : /post/.test(statusText) ? "POST_CLOSE" : /open/.test(statusText) ? "OPEN" : /halt|suspend/.test(statusText) ? "HALTED" : /clos/.test(statusText) ? "CLOSED" : undefined;
  return {
    status,
    indices,
    ...(trades > 0 && { trades }),
    ...(volume > 0 && { volume }),
    ...(turnover > 0 && { turnover: Math.round(turnover) }),
  };
}

function withBreadth(exchange: "DSE" | "CSE", rows: Quote[]): ExchangeSnapshot {
  // A symbol listed twice on the exchange's page (e.g. in two boards) counts once.
  const quotes = uniqueQuotes(rows);
  return {
    exchange,
    indices: [],
    quotes,
    advancers: quotes.filter((q) => q.changePct > 0).length,
    decliners: quotes.filter((q) => q.changePct < 0).length,
    unchanged: quotes.filter((q) => q.changePct === 0).length,
  };
}

export async function getHtml(url: string): Promise<string> {
  const headers = { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" };
  let res: Response;
  try {
    res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  } catch (error) {
    // The server left out its intermediate certificate: fetch it, verify it, try again.
    if (!isChainError(error)) throw error;
    const r = await getWithCompletedChain(url, headers);
    if (r.status < 200 || r.status >= 300) throw new Error(`HTTP ${r.status} from ${url}`);
    return r.body;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.text();
}

export type ExchangeReport = { exchange: "DSE" | "CSE"; ok: boolean; count: number; message: string };

/** Reads both boards. Returns what worked, plus a per-exchange report for the admin test. */
export async function exchangeSnapshot(): Promise<{ snapshot: MarketSnapshot | null; reports: ExchangeReport[] }> {
  // The DSE prices page also shows the indices on DSE's newer site: kept to read them
  // when the home page gives none.
  let dseMarketsHtml: string | null = null;
  const tasks: [("DSE" | "CSE"), () => Promise<Quote[]>][] = [
    [
      "DSE",
      async () => {
        // The current DSE site first; its long-standing price table if that gives nothing.
        let first: unknown = null;
        try {
          const html = await getHtml(DSE_URL());
          dseMarketsHtml = html;
          const strip = parseDseStrip(html);
          const quotes = strip.length ? strip : parsePriceTable(html);
          if (quotes.length >= 5) return quotes;
        } catch (error) {
          first = error;
        }
        const table = parsePriceTable(await getHtml(DSE_TABLE_URL()));
        if (!table.length && first) throw first;
        return table;
      },
    ],
    ["CSE", async () => parsePriceTable(await getHtml(CSE_URL()))],
  ];
  const dhakaToday = new Date(Date.now() + 6 * 3600_000).toISOString().slice(0, 10);
  const [results, cse, dseHome, dseRecent] = await Promise.all([
    Promise.allSettled(tasks.map(([, run]) => run())),
    getHtml(CSE_HOME_URL())
      .then(parseCseSummary)
      .catch((error: unknown) => {
        console.error("[market] CSE summary unavailable:", (error as Error)?.message ?? error);
        return null;
      }),
    getHtml(DSE_HOME_URL())
      .then(parseDseSummary)
      .catch((error: unknown) => {
        console.error("[market] DSE summary unavailable:", (error as Error)?.message ?? error);
        return null;
      }),
    getHtml(DSE_RECENT_URL())
      .then(parseDseRecent)
      .catch((error: unknown) => {
        console.error("[market] DSE day-end table unavailable:", (error as Error)?.message ?? error);
        return null;
      }),
  ]);
  // DSE indices and totals: the home page first, the prices page for whatever it lacks.
  let dse = dseHome;
  if (dseMarketsHtml) {
    const alt = parseDseSummary(dseMarketsHtml);
    if (!dse) dse = alt;
    else {
      const have = new Set(dse.indices.map((i) => i.name));
      dse = {
        ...alt,
        ...Object.fromEntries(Object.entries(dse).filter(([, v]) => v !== undefined)),
        indices: [...dse.indices, ...alt.indices.filter((i) => !have.has(i.name))],
      } as DseSummary;
    }
  }
  // Not all three main indices read live: all three from the day-end table instead (one
  // consistent set, labelled with its date when it is not today's). Its totals count as
  // today's only when the table's newest row is today.
  let dsePrevious = false;
  const haveAll = !!dse && DSE_INDEX_NAMES.every((n) => dse!.indices.some((i) => i.name === n));
  if (dseRecent && dseRecent.indices.length && !haveAll) {
    const today = dseRecent.date === dhakaToday;
    dsePrevious = !today;
    dse = {
      ...(dse ?? {}),
      indices: dseRecent.indices,
      ...(today && { turnover: dseRecent.turnover, volume: dseRecent.volume, trades: dseRecent.trades }),
    } as DseSummary;
  }
  if (dse) dse.indices.sort((a, b) => DSE_INDEX_NAMES.indexOf(a.name as (typeof DSE_INDEX_NAMES)[number]) - DSE_INDEX_NAMES.indexOf(b.name as (typeof DSE_INDEX_NAMES)[number]));
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
      if (exchange === "DSE" && dse) {
        snap.indices = dse.indices;
        if (dsePrevious && dseRecent) snap.indicesAsOf = dseRecent.date;
        if (dse.status) snap.status = dse.status;
        Object.assign(snap, { turnover: dse.turnover, volume: dse.volume, trades: dse.trades });
        extra = `, ${dse.indices.length} indices${dsePrevious ? ` (session of ${dseRecent?.date})` : ""}${dse.turnover ? ", turnover" : ""}`;
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
