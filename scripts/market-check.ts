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
import { exchangeSnapshot, getHtml, parseCseSummary, parseDseRecent, parseDseStrip, parseDseSummary, parsePriceTable } from "../src/lib/market/exchange";

// Load .env (only the MARKET_* lines matter here).
const envFile = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^(MARKET_[A-Z_]+)=(.*)$/.exec(line.trim());
    if (m && process.env[m[1]!] === undefined) process.env[m[1]!] = m[2]!.replace(/^"(.*)"$/, "$1");
  }
}

// www.dsebd.org now redirects to DSE's new site; its old pages live at old.dsebd.org (as the website reads them).
for (const k of ["MARKET_DSE_TABLE_URL", "MARKET_DSE_HOME_URL"]) {
  const v = process.env[k];
  if (v && /^https?:\/\/(www\.)?dsebd\.org\//i.test(v)) process.env[k] = v.replace(/^https?:\/\/(www\.)?dsebd\.org\//i, "https://old.dsebd.org/");
}

const SAVE = process.argv.includes("--save");
const pages = [
  { name: "dse-markets", url: process.env.MARKET_DSE_URL || "https://www.dse.com.bd/markets", read: (h: string) => `${parseDseStrip(h).length || parsePriceTable(h).length} prices` },
  { name: "dse-price-table", url: process.env.MARKET_DSE_TABLE_URL || "https://old.dsebd.org/latest_share_price_scroll_l.php", read: (h: string) => `${parsePriceTable(h).length} prices` },
  {
    name: "dse-home",
    url: process.env.MARKET_DSE_HOME_URL || "https://old.dsebd.org/",
    read: (h: string) => {
      const s = parseDseSummary(h);
      return `indices: ${s.indices.map((i) => `${i.name} ${i.value} (${i.changePct}%)`).join(", ") || "none"}; status: ${s.status ?? "?"}; turnover: ${s.turnover ?? "?"}; trades: ${s.trades ?? "?"}`;
    },
  },
  {
    name: "dse-recent",
    url: process.env.MARKET_DSE_RECENT_URL || "https://www.dse.com.bd/recent-market-information",
    read: (h: string) => {
      const s = parseDseRecent(h);
      return s ? `session ${s.date}: ${s.indices.map((i) => `${i.name} ${i.value} (${i.changePct}%)`).join(", ")}; turnover: ${s.turnover ?? "?"}; trades: ${s.trades ?? "?"}` : "no day-end table found";
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
      const html = await getHtml(p.url);
      if (SAVE) fs.writeFileSync(path.join("market-debug", `${p.name}.html`), html);
      console.log(`✔ ${p.name}  ${Math.round(html.length / 1024)} KB → ${p.read(html)}`);
      // Show the text around the index names and totals, so the reader can be matched to the page.
      if (/^dse-(home|markets)$/.test(p.name)) {
        const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ");
        for (const word of ["DSEX", "DSES", "DS30", "Total Trade", "Total Volume", "Total Value", "Market Status"]) {
          const at = text.indexOf(word);
          if (at >= 0) console.log(`     ${word}: …${text.slice(Math.max(0, at - 40), at + 120).trim()}…`);
        }
      }
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
