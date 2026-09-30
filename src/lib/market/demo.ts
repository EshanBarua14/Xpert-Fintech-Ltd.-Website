import "server-only";
import type { MarketSnapshot, Quote } from "./types";

/*
 * DEMO DATA — for development and design review only. Symbols are real DSE
 * trading codes so layouts can be judged with realistic text, but every
 * price is generated and the site labels it "Demo data — not real prices".
 * Production refuses this mode unless ALLOW_DEMO_MARKET_DATA=true.
 */
const SYMBOLS: [string, number][] = [
  ["GP", 280], ["SQURPHARMA", 210], ["BATBC", 390], ["BEXIMCO", 115], ["BRACBANK", 38], ["RENATA", 720],
  ["WALTONHIL", 520], ["ROBI", 30], ["LHBL", 65], ["ISLAMIBANK", 32], ["CITYBANK", 22], ["OLYMPIC", 150],
  ["MARICO", 2400], ["UPGDCL", 140], ["BERGERPBL", 1700], ["SUMITPOWER", 22], ["BSRMLTD", 85], ["POWERGRID", 45],
  ["DUTCHBANGL", 55], ["EBL", 28], ["PUBALIBANK", 27], ["IFADAUTOS", 40], ["BXPHARMA", 130], ["ACI", 250],
];

/** Well-mixed deterministic random number in [0, 1) for a given seed (mulberry32). */
function rand(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rng = (seed: number) => () => rand(seed);

export function demoSnapshot(now = Date.now()): MarketSnapshot {
  const tick = Math.floor(now / 15000);
  const day = Math.floor(now / 86400000);
  const make = (offset: number): Quote[] =>
    SYMBOLS.map(([symbol, base], i) => {
      const dayRand = rng(day * 97 + i * 13 + offset)();
      const tickRand = rng(tick * 31 + i * 7 + offset)();
      const pct = (dayRand - 0.5) * 12 + (tickRand - 0.5) * 0.8;
      const prev = base;
      const ltp = Math.max(1, prev * (1 + pct / 100));
      return {
        symbol,
        ltp: Math.round(ltp * 10) / 10,
        change: Math.round((ltp - prev) * 10) / 10,
        changePct: Math.round(pct * 100) / 100,
        volume: Math.round(50000 + rng(tick + i)() * 2_000_000),
      };
    });
  const index = (name: string, base: number, seed: number) => {
    const pct = (rng(day * 11 + seed)() - 0.5) * 2.4 + (rng(tick * 5 + seed)() - 0.5) * 0.1;
    return { name, value: Math.round(base * (1 + pct / 100) * 100) / 100, change: Math.round(base * (pct / 100) * 100) / 100, changePct: Math.round(pct * 100) / 100 };
  };
  const dse = make(1);
  const cse = make(2).slice(0, 18);
  const breadth = (q: Quote[]) => ({
    advancers: q.filter((x) => x.changePct > 0).length * 14,
    decliners: q.filter((x) => x.changePct < 0).length * 14,
    unchanged: 40,
  });
  return {
    asOf: new Date(tick * 15000).toISOString(),
    exchanges: [
      { exchange: "DSE", status: "OPEN", indices: [index("DSEX", 5200, 1), index("DS30", 1950, 2), index("DSES", 1140, 3)], turnover: 6.1e9, volume: 1.9e8, trades: 142000, quotes: dse, ...breadth(dse) },
      { exchange: "CSE", status: "OPEN", indices: [index("CASPI", 14800, 4), index("CSE30", 12600, 5)], turnover: 2.3e8, volume: 8.4e6, trades: 9100, quotes: cse, ...breadth(cse) },
    ],
  };
}
