import "server-only";
import { z } from "zod";
import type { MarketSnapshot } from "./types";

/**
 * Validation for the JSON the licensed feed adapter must return
 * (see docs/MARKET-DATA.md). Must match the types in ./types.ts.
 */
const num = z.number().finite();

export const quoteSchema = z.object({
  symbol: z.string().min(1).max(24),
  ltp: num,
  change: num,
  changePct: num,
  volume: num.nonnegative().optional(),
});

export const indexSchema = z.object({
  name: z.string().min(1).max(24),
  value: num,
  change: num,
  changePct: num,
});

export const exchangeSnapshotSchema = z.object({
  exchange: z.enum(["DSE", "CSE"]),
  status: z.enum(["OPEN", "CLOSED", "PRE_OPEN", "POST_CLOSE", "HALTED"]).optional(),
  indices: z.array(indexSchema).max(10).default([]),
  turnover: num.nonnegative().optional(),
  volume: num.nonnegative().optional(),
  trades: num.nonnegative().optional(),
  advancers: z.number().int().nonnegative().optional(),
  decliners: z.number().int().nonnegative().optional(),
  unchanged: z.number().int().nonnegative().optional(),
  quotes: z.array(quoteSchema).max(600).default([]),
  gainers: z.array(quoteSchema).max(20).optional(),
  losers: z.array(quoteSchema).max(20).optional(),
});

export const snapshotSchema = z.object({
  asOf: z.string().datetime({ offset: true }),
  exchanges: z.array(exchangeSnapshotSchema).min(1).max(2),
});


// Compile-time check that the schema and the hand-written types agree.
type Parsed = z.infer<typeof snapshotSchema>;
const _check: (p: Parsed) => MarketSnapshot = (p) => p;
void _check;
