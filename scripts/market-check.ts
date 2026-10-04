/**
 * Checks, from this computer, whether the website can read DSE and CSE.
 *
 *   npm run market:check            what each exchange page gave (prices, indices, totals)
 *   npm run market:check -- --save  also saves the pages to ./market-debug/ so they can
 *                                   be sent to the developer if something is not read
 *
 * Uses the same reader as the website (src/lib/market/exchange.ts) and the
 * MARKET_* addresses in .env when set.
 */
import fs from "node:fs";
import path from "node:path";
import { exchangeSnapshot, parseCseSummary, parseDseStrip, parseDseSummary, parsePriceTable } from "../src/lib/market/exchange";

// Load .env (only the MARKET_* lines matter here).
const envFile = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^(MARKET_[A-Z_]+)=(.*)$/.exec(line.trim());
    if (m && process.env[m[1]!] === undefined) process.env[m[1]!] = m[2]!.replace(/^"(.*)"$/, "$1");
  }
}

const SAVE = process.argv.includes("--save");
const pages = [
  { name: "dse-markets", url: process.env.MARKET_DSE_URL || "https://www.dse.com.bd/markets", read: (h: string) => `${parseDseStrip(h).length || parsePriceTable(h).length} prices` },
  { name: "dse-price-table", url: process.env.MARKET_DSE_TABLE_URL || "https://www.dsebd.org/latest_share_price_scroll_l.php", read: (h: string) => `${parsePriceTable(h).length} prices` },
  {
    name: "dse-home",
    url: process.env.MARKET_DSE_HOME_URL || "https://www.dsebd.org/",
    read: (h: string) => {
      const s = parseDseSummary(h);
      return `indices: ${s.indices.map((i) => `${i.name} ${i.value} (${i.changePct}%)`).join(", ") || "none"}; status: ${s.status ?? "?"}; turnover: ${s.turnover ?? "?"}; trades: ${s.trades ?? "?"}`;
    },
  },
  { name: "cse-current-price", url: process.env.MARKET_CSE_URL || "https://www.cse.com.bd/market/current_price", read: (h: string) => `${parsePriceTable(h).length} prices` },
  {
    name: "cse-home",
    url: process.env.MARKET_CSE_HOME_URL || "https://www.cse.com.bd/",
    read: (h: string) => {
      const s = parseCseSummary(h);
      return `indices: ${s.indices.map((i) => `${i.name} ${i.value} (${i.changePct}%)`).join(", ") || "none"}; status: ${s.status ?? "?"}; value: ${s.turnover ?? "?"}${s.previousSession ? " (previous session)" : ""}`;
    },
  },
];

async function main() {
  console.log(`\nMARKET_DATA_MODE in .env: ${process.env.MARKET_DATA_MODE ?? "(not set — the website shows no live prices; run npm run setup)"}\n`);
  if (SAVE) fs.mkdirSync("market-debug", { recursive: true });
  for (const p of pages) {
    try {
      const res = await fetch(p.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; XpertFintechWebsite/1.0; +https://www.xpertfintech.com)", Accept: "text/html" },
        signal: AbortSignal.timeout(15000),
      });
      const html = await res.text();
      if (SAVE) fs.writeFileSync(path.join("market-debug", `${p.name}.html`), html);
      console.log(`${res.ok ? "✔" : "✖"} ${p.name}  HTTP ${res.status}, ${Math.round(html.length / 1024)} KB → ${p.read(html)}`);
    } catch (error) {
      console.log(`✖ ${p.name}  could not connect: ${(error as Error).message}${(error as { cause?: Error }).cause ? ` (${(error as { cause: Error }).cause.message})` : ""}`);
    }
  }
  const { reports } = await exchangeSnapshot();
  console.log("\nWhat the website will show:");
  for (const r of reports) console.log(`  ${r.ok ? "✔" : "✖"} ${r.exchange}: ${r.message}`);
  if (SAVE) console.log("\nPages saved in ./market-debug/ — send that folder if prices or indices are missing.");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
