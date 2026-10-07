/**
 * Pure simulation engine for the OMS product preview. No network, no real instruments.
 * Kept free of React so it can be unit-tested.
 */

export type Side = "BUY" | "SELL";
export type OrderStatus = "WORKING" | "FILLED" | "REJECTED" | "CANCELLED";

export interface Instrument {
  symbol: string;
  name: string;
  prevClose: number;
  ltp: number;
  volume: number;
}

export interface Order {
  id: number;
  symbol: string;
  side: Side;
  qty: number;
  price: number;
  status: OrderStatus;
  reason?: string;
  time: number; // simulation tick
}

export interface Position {
  symbol: string;
  qty: number;
  avgPrice: number;
}

export interface RiskLimits {
  maxOrderValue: number;
  priceBandPct: number; // allowed distance from previous close
}

export interface SimState {
  tick: number;
  instruments: Instrument[];
  orders: Order[];
  positions: Position[];
  buyingPower: number;
  limits: RiskLimits;
  nextOrderId: number;
  seed: number;
}

export interface RiskCheck {
  id: "qty" | "band" | "maxValue" | "buyingPower" | "holding";
  passed: boolean;
}

/** Clearly fictional instruments. Never replace these with real DSE/CSE tickers. */
export const SIM_INSTRUMENTS: ReadonlyArray<Pick<Instrument, "symbol" | "name" | "prevClose">> = [
  { symbol: "SIM-ALFA", name: "Alfa Demo Industries", prevClose: 48.2 },
  { symbol: "SIM-BETA", name: "Beta Demo Bank", prevClose: 21.6 },
  { symbol: "SIM-GAMA", name: "Gamma Demo Power", prevClose: 132.5 },
  { symbol: "SIM-DLTA", name: "Delta Demo Textiles", prevClose: 9.8 },
  { symbol: "SIM-EPSN", name: "Epsilon Demo Pharma", prevClose: 287.0 },
  { symbol: "SIM-ZETA", name: "Zeta Demo Telecom", prevClose: 64.4 },
];

export function createState(seed = 42): SimState {
  return {
    tick: 0,
    instruments: SIM_INSTRUMENTS.map((i) => ({ ...i, ltp: i.prevClose, volume: 0 })),
    orders: [],
    positions: [],
    buyingPower: 500_000,
    limits: { maxOrderValue: 200_000, priceBandPct: 10 },
    nextOrderId: 1,
    seed,
  };
}

/** Deterministic PRNG (mulberry32) so tests and screenshots are reproducible. */
function rand(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, (seed + 0x6d2b79f5) | 0];
}

const round = (n: number) => Math.round(n * 10) / 10; // 0.10 tick size

export function priceBand(inst: Instrument, pct: number): [number, number] {
  return [round(inst.prevClose * (1 - pct / 100)), round(inst.prevClose * (1 + pct / 100))];
}

export function runRiskChecks(state: SimState, symbol: string, side: Side, qty: number, price: number): RiskCheck[] {
  const inst = state.instruments.find((i) => i.symbol === symbol);
  const value = qty * price;
  const [lo, hi] = inst ? priceBand(inst, state.limits.priceBandPct) : [0, 0];
  const held = state.positions.find((p) => p.symbol === symbol)?.qty ?? 0;
  const checks: RiskCheck[] = [
    { id: "qty", passed: Number.isInteger(qty) && qty > 0 },
    { id: "band", passed: Boolean(inst) && price >= lo && price <= hi },
    { id: "maxValue", passed: value <= state.limits.maxOrderValue },
  ];
  checks.push(side === "BUY" ? { id: "buyingPower", passed: value <= state.buyingPower } : { id: "holding", passed: qty <= held });
  return checks;
}

function fill(state: SimState, order: Order, price: number): SimState {
  const positions = [...state.positions];
  const idx = positions.findIndex((p) => p.symbol === order.symbol);
  const existing = idx >= 0 ? positions[idx]! : { symbol: order.symbol, qty: 0, avgPrice: 0 };
  let buyingPower = state.buyingPower;
  let updated: Position;
  if (order.side === "BUY") {
    const qty = existing.qty + order.qty;
    updated = { symbol: order.symbol, qty, avgPrice: (existing.qty * existing.avgPrice + order.qty * price) / qty };
    buyingPower -= order.qty * price;
  } else {
    updated = { ...existing, qty: existing.qty - order.qty };
    buyingPower += order.qty * price;
  }
  if (idx >= 0) positions[idx] = updated;
  else positions.push(updated);
  return {
    ...state,
    buyingPower,
    positions: positions.filter((p) => p.qty > 0),
    orders: state.orders.map((o) => (o.id === order.id ? { ...o, status: "FILLED" as const, price } : o)),
    instruments: state.instruments.map((i) => (i.symbol === order.symbol ? { ...i, volume: i.volume + order.qty } : i)),
  };
}

function marketable(order: Order, ltp: number): boolean {
  return order.side === "BUY" ? ltp <= order.price : ltp >= order.price;
}

export function placeOrder(
  state: SimState, symbol: string, side: Side, qty: number, price: number,
): { state: SimState; order: Order; checks: RiskCheck[] } {
  const checks = runRiskChecks(state, symbol, side, qty, price);
  const failed = checks.find((c) => !c.passed);
  const order: Order = {
    id: state.nextOrderId, symbol, side, qty, price,
    status: failed ? "REJECTED" : "WORKING", reason: failed?.id, time: state.tick,
  };
  let next: SimState = { ...state, nextOrderId: state.nextOrderId + 1, orders: [order, ...state.orders] };
  const inst = next.instruments.find((i) => i.symbol === symbol);
  if (!failed && inst && marketable(order, inst.ltp)) next = fill(next, order, inst.ltp);
  // Return the order as it stands after any immediate fill.
  const final = next.orders.find((o) => o.id === order.id) ?? order;
  return { state: next, order: final, checks };
}

export function cancelOrder(state: SimState, id: number): SimState {
  return { ...state, orders: state.orders.map((o) => (o.id === id && o.status === "WORKING" ? { ...o, status: "CANCELLED" as const } : o)) };
}

/** Advance the market one tick: random walk within the price band, then fill marketable working orders. */
export function step(state: SimState): SimState {
  let seed = state.seed;
  const instruments = state.instruments.map((inst) => {
    let r: number;
    [r, seed] = rand(seed);
    const [lo, hi] = priceBand(inst, state.limits.priceBandPct);
    // Symmetric whole-tick moves (0.10) with a gentle pull back toward the previous close.
    const drift = Math.max(-0.15, Math.min(0.15, ((inst.ltp - inst.prevClose) / inst.prevClose) * 1.5));
    let size: number;
    [size, seed] = rand(seed);
    const maxTicks = Math.max(1, Math.round((inst.ltp * 0.004) / 0.1));
    const ticks = 1 + Math.floor(size * maxTicks);
    const dir = r < 0.38 + drift ? -1 : r > 0.62 + drift ? 1 : 0;
    const ltp = Math.min(hi, Math.max(lo, round(inst.ltp + dir * ticks * 0.1)));
    let v: number;
    [v, seed] = rand(seed);
    return { ...inst, ltp, volume: inst.volume + Math.floor(v * 400) };
  });
  let next: SimState = { ...state, tick: state.tick + 1, seed, instruments };
  for (const order of next.orders) {
    if (order.status !== "WORKING") continue;
    const inst = next.instruments.find((i) => i.symbol === order.symbol)!;
    if (marketable(order, inst.ltp)) next = fill(next, order, inst.ltp);
  }
  return next;
}
