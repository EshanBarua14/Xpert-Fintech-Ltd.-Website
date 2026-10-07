"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A visitor's watchlist ("DSE:GP", "CSE:ACI"…), kept in this browser only
 * (localStorage, no account). Survives reloads; stays in step across tabs.
 * If storage is blocked (private mode), the list works for the visit only.
 */
const KEY = "xfl-watchlist";

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    setList(read());
    const onStorage = (e: StorageEvent) => e.key === KEY && setList(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const toggle = useCallback((id: string) => {
    setList((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage blocked: keep in memory */
      }
      return next;
    });
  }, []);
  return { list, has: (id: string) => list.includes(id), toggle };
}
