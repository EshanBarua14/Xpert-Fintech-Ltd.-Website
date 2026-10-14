"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A slideshow clock shared by the self-playing explainers (consortium map,
 * RMS checks, product map …). Each item plays for `dwell` milliseconds and
 * the tour then moves on, unless the visitor is pointing at it, has picked
 * an item in the last `resume` milliseconds, has paused it, or it is off
 * screen. An item that is waiting stays on its last frame. With reduced
 * motion nothing moves by itself: every item shows its finished state and
 * the visitor steps through.
 */
export function useAutoTour(count: number, opts: { dwell: number | ((i: number) => number); resume?: number; tick?: number }) {
  const { dwell, resume = 14000, tick = 100 } = opts;
  const [active, setActive] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hold, setHold] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const waitUntil = useRef(0);
  const clock = useRef(0);
  const dwellOf = useCallback((i: number) => (typeof dwell === "function" ? dwell(i) : dwell), [dwell]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    if (mq.matches) setPlaying(false);
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { threshold: 0.15 });
    if (rootRef.current) io.observe(rootRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce) {
      clock.current = dwellOf(active);
      setElapsed(clock.current);
      if (barRef.current) barRef.current.style.transform = "scaleX(1)";
      return;
    }
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      if (!visible || document.hidden) return;
      const d = dwellOf(active);
      const waiting = !playing || hold || Date.now() < waitUntil.current || count < 2;
      clock.current = Math.min(d, clock.current + dt);
      if (clock.current >= d && !waiting) {
        clock.current = 0;
        setActive((a) => (a + 1) % Math.max(count, 1));
      }
      setElapsed(clock.current);
      if (barRef.current) barRef.current.style.transform = `scaleX(${Math.min(1, clock.current / d)})`;
    }, tick);
    return () => clearInterval(id);
  }, [active, playing, hold, visible, reduce, count, dwellOf, tick]);

  const choose = useCallback(
    (i: number) => {
      const n = Math.max(count, 1);
      setActive(((i % n) + n) % n);
      clock.current = 0;
      setElapsed(0);
      waitUntil.current = Date.now() + resume;
      if (barRef.current) barRef.current.style.transform = "scaleX(0)";
    },
    [count, resume],
  );

  /** Spread on the tour's outer element: pointing at it or tabbing into it holds the tour. */
  const holdProps = {
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && setHold(true),
    onPointerLeave: () => setHold(false),
    onFocusCapture: (e: React.FocusEvent) => (e.target as HTMLElement).matches?.(":focus-visible") && setHold(true),
    onBlurCapture: () => setHold(false),
  };

  return {
    active,
    elapsed,
    choose,
    playing,
    togglePlaying: () => {
      setPlaying((p) => !p);
      waitUntil.current = 0;
    },
    reduce,
    rootRef,
    barRef,
    holdProps,
  };
}
