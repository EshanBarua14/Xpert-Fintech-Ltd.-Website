"use client";

/**
 * WorkflowDiagram: a CMS-driven, animated step flow (OMS, RMS, DMS, BO Account Opening…).
 *
 * - Steps come from props (translated server-side). No hard-coded copy.
 * - Auto-advances while visible; pauses offscreen, on hover/focus, and when the tab is hidden.
 * - prefers-reduced-motion: no auto-advance, no pulse; all steps and details remain readable.
 * - Keyboard: steps are buttons; ←/→ (or ↑/↓) move between them, Home/End jump.
 * - Horizontal from 768px, vertical below (CSS).
 */

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import styles from "./WorkflowDiagram.module.css";

export interface WorkflowStep {
  id: string;
  title: string;
  body?: string;
}

export interface WorkflowDiagramProps {
  steps: WorkflowStep[];
  /** Accessible name, e.g. "OMS order workflow". */
  label: string;
  autoPlay?: boolean;
  intervalMs?: number;
  /** Text for the step counter, e.g. (i, n) => `Step ${i} of ${n}`. */
  stepCounter?: (current: number, total: number) => string;
  onStepChange?: (index: number, step: WorkflowStep) => void;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export default function WorkflowDiagram({
  steps,
  label,
  autoPlay = true,
  intervalMs = 2200,
  stepCounter = (i, n) => `Step ${i} of ${n}`,
  onStepChange,
}: WorkflowDiagramProps) {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = useCallback(
    (i: number, focus = false) => {
      const next = (i + steps.length) % steps.length;
      setActive(next);
      if (focus) buttonRefs.current[next]?.focus();
      const step = steps[next];
      if (step) onStepChange?.(next, step);
    },
    [steps, onStepChange],
  );

  // Visibility: only animate while on screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Auto-advance.
  useEffect(() => {
    if (!autoPlay || reduced || paused || !visible || steps.length < 2) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setActive((a) => (a + 1) % steps.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [autoPlay, reduced, paused, visible, steps.length, intervalMs]);

  if (steps.length === 0) return null;
  const current = steps[active] ?? steps[0]!;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const map: Record<string, number> = {
      ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: steps.length - 1,
    };
    const target = map[e.key];
    if (target === undefined) return;
    e.preventDefault();
    select(target, true);
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-reduced={reduced || undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <ol className={styles.track} aria-label={label}>
        {steps.map((step, i) => {
          const state = i < active ? "done" : i === active ? "active" : "upcoming";
          return (
            <li key={step.id} className={styles.step} data-state={state}>
              <button
                ref={(el) => {
                  buttonRefs.current[i] = el;
                }}
                type="button"
                className={styles.node}
                aria-current={i === active ? "step" : undefined}
                aria-controls={`${step.id}-detail`}
                tabIndex={i === active ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                <span className={styles.index} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.title}>{step.title}</span>
              </button>
              {i < steps.length - 1 && (
                <span className={styles.connector} aria-hidden="true">
                  <span className={styles.pulse} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div id={`${current.id}-detail`} className={styles.detail} aria-live="polite">
        <p className={styles.counter}>{stepCounter(active + 1, steps.length)}</p>
        <p className={styles.detailTitle}>{current.title}</p>
        {current.body && <p className={styles.detailBody}>{current.body}</p>}
      </div>
    </div>
  );
}
