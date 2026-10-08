"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import { productVars, type ProductLook } from "./ProductMark";

export type AutomationStep = { id: string; title: string; body: string | null };
export type AutomationLabels = { running: string; done: string; step: string; pause: string; play: string };

const STEP_MS = 2200;

/**
 * The product's workflow (Admin → Products → Workflow steps) running by
 * itself: a signal moves from step to step, each step lights up as it is
 * handled and is ticked off when done, then the run starts again. Pauses
 * off-screen, on hover or focus, with its button, and for reduced motion
 * (which shows every step done).
 */
export function AutomationFlow({ steps, productKey, labels, look }: { steps: AutomationStep[]; productKey: string | null; labels: AutomationLabels; look?: ProductLook | null }) {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [hold, setHold] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const n = steps.length;

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = visible && !hold && !paused && !reduce;
  useEffect(() => {
    if (!running) return;
    // One extra beat at the end shows the whole run complete before it restarts.
    const id = setTimeout(() => setActive((a) => (a + 1) % (n + 1)), active === n ? STEP_MS * 1.4 : STEP_MS);
    return () => clearTimeout(id);
  }, [active, running, n]);

  if (n < 2) return null;
  const cur = reduce ? n : active;
  const pct = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const fill = Math.min(100, pct(Math.min(cur, n - 1)));
  const status = cur >= n ? labels.done : `${labels.running}: ${steps[cur]!.title}`;

  return (
    <div
      ref={ref}
      style={productVars(productKey, look)}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={() => setHold(false)}
      className="relative overflow-hidden rounded-[1.75rem] border border-fg/10 bg-navy-900 p-5 md:p-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full opacity-25 blur-3xl" style={{ background: "var(--p-to)" }} />
      <div className="relative mb-6 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-fg/10 bg-fg/[0.04] px-3 py-1.5 text-sm font-semibold text-text-primary" aria-live="polite">
          <span className={cn("size-2 rounded-full", cur >= n ? "bg-market-up" : "animate-pulse bg-[var(--p-to)]")} aria-hidden="true" />
          {status}
        </span>
        {!reduce && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            className="ml-auto inline-flex h-9 items-center rounded-full border border-fg/15 px-4 text-sm font-semibold text-text-secondary hover:border-fg/40 hover:text-fg"
          >
            {paused ? labels.play : labels.pause}
          </button>
        )}
      </div>

      {/* Rail with the moving signal (horizontal from tablet up, vertical on phones) */}
      <div className="relative">
        <div aria-hidden="true" className="absolute top-6 right-[calc(50%/var(--n))] left-[calc(50%/var(--n))] hidden h-1 rounded-full bg-fg/[0.08] md:block" style={{ "--n": n } as CSSProperties}>
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--p-from)] to-[var(--p-to)] transition-[width] duration-700" style={{ width: `${fill}%` }} />
          {cur < n && (
            <span
              className="auto-packet absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_16px_4px_var(--p-to)]"
              style={{ left: `${pct(cur)}%` }}
            />
          )}
        </div>
        <div aria-hidden="true" className="absolute top-6 bottom-6 left-6 w-1 rounded-full bg-fg/[0.08] md:hidden">
          <div className="w-full rounded-full bg-gradient-to-b from-[var(--p-from)] to-[var(--p-to)] transition-[height] duration-700" style={{ height: `${fill}%` }} />
        </div>
        <ol className="auto-grid relative grid gap-6 md:gap-4" style={{ "--n": n } as CSSProperties}>
          {steps.map((s, i) => {
            const done = i < cur;
            const on = i === cur;
            return (
              <li key={s.id} className="flex gap-4 md:flex-col md:items-center md:text-center" aria-current={on ? "step" : undefined}>
                <span
                  className={cn(
                    "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl border font-mono text-sm font-semibold transition-colors duration-500",
                    done && "border-transparent bg-gradient-to-br from-[var(--p-from)] to-[var(--p-to)] text-white",
                    on && "auto-node-on border-[var(--p-to)] bg-navy-800 text-text-primary",
                    !done && !on && "border-fg/15 bg-navy-800 text-text-secondary",
                  )}
                >
                  {done ? (
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-5 fill-none stroke-current stroke-[2]"><path d="m3.5 8.5 3 3 6-7" /></svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="flex min-w-0 flex-col gap-1 pt-1 md:pt-0">
                  <span className={cn("font-semibold leading-snug transition-colors", on || done ? "text-text-primary" : "text-text-secondary")}>{s.title}</span>
                  {s.body && <span className="text-sm leading-relaxed text-text-secondary">{s.body}</span>}
                  <span className="sr-only">{labels.step.replace("{i}", String(i + 1)).replace("{n}", String(n))}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
