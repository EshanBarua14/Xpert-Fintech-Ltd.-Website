"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A number that counts up from 0 when the dashboard opens (the real value is in the HTML). */
export function AdminCount({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (reduced() || value <= 0) return setShown(value);
    let frame = 0;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    setShown(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className="tabular">{shown.toLocaleString("en-US")}</span>;
}

/**
 * Keeps the page's figures current by itself: refreshes the data every
 * `seconds` while the tab is visible and shows when it last did.
 */
export function LiveRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  const [at, setAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    setAt(new Date());
    timer.current = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
      setAt(new Date());
    }, seconds * 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [router, seconds]);
  return (
    <span className="inline-flex items-center gap-2 text-xs text-text-secondary" title={`Figures refresh by themselves every ${seconds} seconds`}>
      <span className="admin-live" aria-hidden="true" />
      Live
      {at && <span>· updated {at.toLocaleTimeString("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit" })}</span>}
    </span>
  );
}

/** Good morning / afternoon / evening and the time in Dhaka, ticking. */
export function Greeting({ name }: { name: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const hour = now ? Number(now.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", hour12: false })) : 12;
  const part = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <>
      <span className="text-sm text-text-secondary" suppressHydrationWarning>
        {now
          ? `${part} · ${now.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} · Dhaka`
          : "\u00a0"}
      </span>
      <h1 className="font-display text-3xl font-semibold md:text-4xl">
        Welcome, <span className="admin-gradient-text">{name}</span>
      </h1>
    </>
  );
}

/** A ring that fills to `done / total` once shown. */
export function ProgressRing({ done, total, size = 92 }: { done: number; total: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const share = total ? done / total : 0;
  const [offset, setOffset] = useState(c * (1 - share));
  useEffect(() => {
    if (reduced()) return setOffset(c * (1 - share));
    setOffset(c);
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setOffset(c * (1 - share))));
    return () => cancelAnimationFrame(t);
  }, [c, share]);
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${done} of ${total} done`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <defs>
          <linearGradient id="admin-ring-g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-sky)" />
            <stop offset="100%" stopColor="var(--color-gold)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={8} />
        <circle className="admin-ring" cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#admin-ring-g)" strokeWidth={8} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <span aria-hidden="true" className="tabular absolute text-lg font-semibold">{Math.round(share * 100)}%</span>
    </span>
  );
}

/** Replays the page's arrival (sections fade up in turn) on every admin page change. */
export function PageEnter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="admin-enter">
      {children}
    </div>
  );
}
