"use client";

import { useEffect, useMemo, useState } from "react";
import { withSessions, type MarketPayload } from "@/lib/market/types";

/** Default poll interval; the server tells the real one (Admin → Market data: 15, 30 or 60 s). */
let pollMs = 30_000;

/*
 * One shared poller for every market widget on the page (ticker, status line,
 * Market pulse): a single request to /api/market every 15–60 s (Admin → Market data) while the tab is
 * visible, however many widgets are mounted.
 */
type Moves = Record<string, "up" | "down">;
type State = { data: MarketPayload; moves: Moves; /** a fresh answer from /api/market has arrived */ loaded?: boolean };

/** Two payloads for the same moment: keep the one that knows more (newer prices, then more share figures). */
function richer(a: MarketPayload, b: MarketPayload): MarketPayload {
  const ta = a.snapshot ? Date.parse(a.snapshot.asOf) : 0;
  const tb = b.snapshot ? Date.parse(b.snapshot.asOf) : 0;
  if (ta !== tb) return ta > tb ? a : b;
  return b.shares.length > a.shares.length ? b : a;
}
const listeners = new Set<(s: State) => void>();
let state: State | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let inFlight = false;

function emit(next: State) {
  state = next;
  for (const l of listeners) l(next);
}

async function load() {
  if (inFlight || !state) return;
  if (document.hidden) return schedule();
  inFlight = true;
  try {
    const res = await fetch("/api/market", { cache: "no-store" });
    if (res.ok) {
      const next = (await res.json()) as MarketPayload;
      if (next.refreshSeconds && next.refreshSeconds >= 10) pollMs = next.refreshSeconds * 1000;
      const old = new Map<string, number>();
      for (const ex of state.data.snapshot?.exchanges ?? []) for (const q of ex.quotes) old.set(`${ex.exchange}:${q.symbol}`, q.ltp);
      const moves: Moves = {};
      for (const ex of next.snapshot?.exchanges ?? []) {
        for (const q of ex.quotes) {
          const before = old.get(`${ex.exchange}:${q.symbol}`);
          if (before !== undefined && before !== q.ltp) moves[`${ex.exchange}:${q.symbol}`] = q.ltp > before ? "up" : "down";
        }
      }
      emit({ data: next, moves, loaded: true });
    }
  } catch {
    /* keep the last good data */
  } finally {
    inFlight = false;
    if (state && !state.loaded) emit({ ...state, loaded: true });
  }
  schedule();
}

function schedule() {
  clearTimeout(timer);
  if (listeners.size) timer = setTimeout(load, pollMs);
}

function onVisible() {
  if (!document.hidden && listeners.size) {
    clearTimeout(timer);
    void load();
  }
}

export function useMarket(initial: MarketPayload) {
  const [current, setCurrent] = useState<State>(() => (state ? { ...state, data: richer(state.data, initial) } : { data: initial, moves: {} }));

  useEffect(() => {
    if (initial.mode === "none") return;
    if (initial.refreshSeconds && initial.refreshSeconds >= 10) pollMs = initial.refreshSeconds * 1000;
    if (!state) state = { data: initial, moves: {} };
    else if (richer(state.data, initial) !== state.data) emit({ ...state, data: initial });
    listeners.add(setCurrent);
    if (listeners.size === 1) {
      document.addEventListener("visibilitychange", onVisible);
      // The page may be cached for a few minutes: refresh at once if the snapshot is old.
      const asOf = state.data.snapshot ? Date.parse(state.data.snapshot.asOf) : 0;
      if (!asOf || Date.now() - asOf > pollMs) void load();
      else schedule();
    }
    return () => {
      listeners.delete(setCurrent);
      if (!listeners.size) {
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", onVisible);
      }
    };
  }, [initial]);

  // The session (pre-opening, open, post-closing, closed) follows the clock in Dhaka,
  // so it changes on time even between refreshes: checked every 20 seconds.
  const [minute, setMinute] = useState(() => Math.floor(Date.now() / 60_000));
  useEffect(() => {
    const id = setInterval(() => setMinute(Math.floor(Date.now() / 60_000)), 20_000);
    return () => clearInterval(id);
  }, []);
  const data = useMemo(() => withSessions(current.data, new Date()), [current.data, minute]);
  return { ...current, data };
}
