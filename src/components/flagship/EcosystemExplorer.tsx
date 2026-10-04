"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { EcosystemMap, type EcosystemLabels, type EcosystemModuleInfo, type EcosystemModuleKey } from "./EcosystemMap";

/* Shapes match src/lib/public/ecosystem.ts (kept here so this client file has no server imports). */
type EcoNode = { key: string; layer: "MARKET" | "XFL" | "PRODUCT" | "INSTITUTION" | "USER"; label: string; description: string | null; cta: string | null; href: string | null; mobileOrder: number };
type EcoGraph = { nodes: EcoNode[]; edges: { from: string; to: string; kind: string }[]; flows: { key: string; name: string; isPlayback: boolean; steps: { node: string; title: string; body: string | null }[] }[] };

export type TourLabels = {
  start: string;
  meta: string; // "{n} steps · about {s} seconds"
  step: string; // "Step {i} of {n}"
  prev: string;
  next: string;
  pause: string;
  play: string;
  end: string;
  replay: string;
  worksWith: string;
  explore: string;
  close: string;
  layers: Record<EcoNode["layer"], string>;
};

const NODE_MODULE: Record<string, EcosystemModuleKey> = { oms: "OMS", rms: "RMS", dms: "DMS", "bo-account-opening": "BO", ekyc: "eKYC", "back-office": "Back office" };
const LAYERS: EcoNode["layer"][] = ["MARKET", "XFL", "PRODUCT", "INSTITUTION", "USER"];

/**
 * The ecosystem experience: the map (tablets and up), a guided tour that plays
 * Admin → Ecosystem's "playback" flow in under 30 seconds, and on phones a
 * vertical flow (market → Xpert → products → institutions → users) whose
 * nodes open a bottom sheet. The tour can be paused, stepped and ended; with
 * reduced motion it never plays by itself.
 */
export function EcosystemExplorer({
  labels,
  modules,
  graph,
  tour,
  className,
}: {
  labels: EcosystemLabels;
  modules?: Partial<Record<EcosystemModuleKey, EcosystemModuleInfo>>;
  graph: EcoGraph;
  tour: TourLabels;
  className?: string;
}) {
  const flow = graph.flows.find((f) => f.isPlayback);
  const steps = flow?.steps ?? [];
  const [step, setStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [reduce, setReduce] = useState(false);
  const stepMs = steps.length ? Math.min(3600, Math.floor(28_000 / steps.length)) : 3600;
  const current = step === null ? null : steps[step];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (step === null || !playing || reduce) return;
    const id = setTimeout(() => {
      if (step + 1 < steps.length) setStep(step + 1);
      else setPlaying(false); // end: stay on the last step, offer Replay
    }, stepMs);
    return () => clearTimeout(id);
  }, [step, playing, reduce, steps.length, stepMs]);

  const start = () => {
    setStep(0);
    setPlaying(!reduce);
  };
  const end = () => {
    setStep(null);
    setPlaying(false);
  };
  const highlight = step === null ? undefined : current ? (NODE_MODULE[current.node] ?? null) : null;
  const done = step !== null && step === steps.length - 1 && !playing;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="hidden md:block">
        <EcosystemMap labels={labels} modules={modules} highlight={highlight} />
      </div>
      <MobileFlow graph={graph} tour={tour} activeKey={current?.node ?? null} />

      {steps.length > 0 && (
        <div className="glass rounded-3xl p-4 sm:p-5" aria-live="polite">
          {step === null ? (
            <div className="flex flex-wrap items-center gap-4">
              <button type="button" onClick={start} className="btn-glow inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white">
                <span aria-hidden="true">▶</span> {flow?.name ?? tour.start}
              </button>
              <span className="text-sm text-text-secondary">
                {tour.meta.replace("{n}", String(steps.length)).replace("{s}", String(Math.round((stepMs * steps.length) / 1000)))}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <ol className="flex gap-1.5" aria-hidden="true">
                {steps.map((s, i) => (
                  <li key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-fg/10">
                    <span
                      key={`${i}-${step}-${playing}`}
                      className={cn("block h-full rounded-full bg-gradient-to-r from-brand-sky to-cyan-300", i < step ? "w-full" : i > step ? "w-0" : playing && !reduce ? "eco-tour-fill" : "w-full")}
                      style={i === step && playing && !reduce ? { animationDuration: `${stepMs}ms` } : undefined}
                    />
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs tracking-widest text-accent">{tour.step.replace("{i}", String(step + 1)).replace("{n}", String(steps.length))}</p>
                  <p className="mt-1 font-display text-xl font-semibold">{current?.title}</p>
                  {current?.body && <p className="mt-1 text-sm text-text-secondary">{current.body}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="h-10 rounded-full border border-fg/15 px-4 text-sm font-semibold disabled:opacity-40" aria-label={tour.prev}>
                    ←
                  </button>
                  {done ? (
                    <button type="button" onClick={start} className="h-10 rounded-full border border-brand-sky/50 px-4 text-sm font-semibold text-brand-sky">
                      ↺ {tour.replay}
                    </button>
                  ) : (
                    !reduce && (
                      <button type="button" onClick={() => setPlaying((p) => !p)} className="h-10 rounded-full border border-fg/15 px-4 text-sm font-semibold" aria-pressed={!playing}>
                        {playing ? `❚❚ ${tour.pause}` : `▶ ${tour.play}`}
                      </button>
                    )
                  )}
                  <button type="button" onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step === steps.length - 1} className="h-10 rounded-full border border-fg/15 px-4 text-sm font-semibold disabled:opacity-40" aria-label={tour.next}>
                    →
                  </button>
                  <button type="button" onClick={end} className="h-10 rounded-full px-3 text-sm text-text-secondary hover:text-fg">
                    {tour.end}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Phones: the ecosystem as a vertical flow of layers; tapping a node opens its details. */
function MobileFlow({ graph, tour, activeKey }: { graph: EcoGraph; tour: TourLabels; activeKey: string | null }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<EcoNode | null>(null);
  const layers = useMemo(
    () =>
      LAYERS.map((layer) => ({ layer, nodes: graph.nodes.filter((n) => n.layer === layer).sort((a, b) => a.mobileOrder - b.mobileOrder) })).filter((l) => l.nodes.length),
    [graph.nodes],
  );
  const byKey = useMemo(() => new Map(graph.nodes.map((n) => [n.key, n])), [graph.nodes]);
  if (!layers.length) return null;
  const neighbours = (key: string) =>
    [...new Set(graph.edges.flatMap((e) => (e.from === key ? [e.to] : e.to === key ? [e.from] : [])))].map((k) => byKey.get(k)).filter((n): n is EcoNode => Boolean(n));

  return (
    <div className="md:hidden">
      <ol className="flex flex-col">
        {layers.map((l, i) => (
          <li key={l.layer} className="flex flex-col items-center">
            {i > 0 && (
              <span aria-hidden="true" className="eco-mobile-link relative h-8 w-px bg-gradient-to-b from-brand-sky/20 via-brand-sky/50 to-brand-sky/20">
                <span className="absolute left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_2px_rgb(103_232_249/0.6)]" />
              </span>
            )}
            <section className={cn("glass w-full rounded-3xl p-4", l.layer === "XFL" && "border-brand-sky/40 bg-brand-royal/10")}>
              <h3 className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-text-secondary uppercase">{tour.layers[l.layer]}</h3>
              <ul className="flex flex-wrap gap-2">
                {l.nodes.map((n) => {
                  const on = activeKey === n.key;
                  return (
                    <li key={n.key}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(n);
                          requestAnimationFrame(() => dialogRef.current?.showModal());
                        }}
                        aria-haspopup="dialog"
                        className={cn(
                          "min-h-11 rounded-2xl border px-3.5 py-2 text-left text-sm font-semibold transition-[border-color,background-color,box-shadow] duration-300",
                          on ? "border-cyan-300 bg-cyan-300/15 shadow-[0_0_24px_-6px_rgb(103_232_249/0.8)]" : l.layer === "PRODUCT" ? "border-brand-sky/30 bg-brand-sky/[0.07]" : "border-fg/10 bg-fg/[0.03]",
                        )}
                      >
                        {n.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </li>
        ))}
      </ol>

      <dialog
        ref={dialogRef}
        aria-labelledby="eco-sheet-title"
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
        className="eco-sheet mx-0 mt-auto mb-0 w-full max-w-none rounded-t-[1.75rem] border border-fg/10 bg-navy-900 p-0 text-text-primary backdrop:bg-ink-950/70 backdrop:backdrop-blur-sm"
      >
        {open && (
          <div className="flex max-h-[80dvh] flex-col gap-4 overflow-y-auto p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <span aria-hidden="true" className="mx-auto -mt-2 h-1 w-10 rounded-full bg-fg/20" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-text-secondary uppercase">{tour.layers[open.layer]}</p>
                <h3 id="eco-sheet-title" className="mt-1 font-display text-2xl font-semibold">
                  {open.label}
                </h3>
              </div>
              <button type="button" onClick={() => dialogRef.current?.close()} aria-label={tour.close} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-fg/15">
                ×
              </button>
            </div>
            {open.description && <p className="text-text-secondary">{open.description}</p>}
            {neighbours(open.key).length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-wide text-text-secondary">{tour.worksWith}</p>
                <ul className="flex flex-wrap gap-2">
                  {neighbours(open.key).map((n) => (
                    <li key={n.key}>
                      <button type="button" onClick={() => setOpen(n)} className="rounded-full border border-fg/10 px-3 py-1.5 text-sm hover:border-brand-sky/50">
                        {n.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {open.href && (
              <Link href={open.href} className="btn-glow mt-2 inline-flex h-12 items-center justify-center rounded-full px-6 font-semibold text-white">
                {open.cta ?? tour.explore} →
              </Link>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
