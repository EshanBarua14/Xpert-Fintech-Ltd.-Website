"use client";

import { useEffect, useRef, useState } from "react";
import type { MarketPayload } from "@/lib/market/types";

const POLL_MS = 20_000;

/**
 * Keeps market data fresh: starts from the server-rendered snapshot, then
 * polls /api/market every 20 s while the tab is visible. Returns the data and
 * a map of price moves since the last update (for the up/down flash).
 */
export function useMarket(initial: MarketPayload) {
  const [data, setData] = useState(initial);
  const [moves, setMoves] = useState<Record<string, "up" | "down">>({});
  const prev = useRef(initial);

  useEffect(() => {
    if (initial.mode === "none") return;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    const load = async () => {
      if (document.hidden) return schedule();
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (res.ok) {
          const next = (await res.json()) as MarketPayload;
          const changed: Record<string, "up" | "down"> = {};
          const old = new Map<string, number>();
          for (const ex of prev.current.snapshot?.exchanges ?? []) for (const q of ex.quotes) old.set(`${ex.exchange}:${q.symbol}`, q.ltp);
          for (const ex of next.snapshot?.exchanges ?? []) {
            for (const q of ex.quotes) {
              const before = old.get(`${ex.exchange}:${q.symbol}`);
              if (before !== undefined && before !== q.ltp) changed[`${ex.exchange}:${q.symbol}`] = q.ltp > before ? "up" : "down";
            }
          }
          prev.current = next;
          if (!stopped) {
            setData(next);
            setMoves(changed);
          }
        }
      } catch {
        /* keep the last good data */
      }
      schedule();
    };
    const schedule = () => {
      if (!stopped) timer = setTimeout(load, POLL_MS);
    };
    // The page itself may be cached for a few minutes: refresh at once if the snapshot is old.
    const asOf = initial.snapshot ? Date.parse(initial.snapshot.asOf) : 0;
    if (!asOf || Date.now() - asOf > 30_000) load();
    else schedule();
    const onVisible = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [initial.mode, initial.snapshot]);

  return { data, moves };
}
