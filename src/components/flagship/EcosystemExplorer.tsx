"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
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

const LAYERS: EcoNode["layer"][] = ["MARKET", "XFL", "PRODUCT", "INSTITUTION", "USER"];

/**
 * The ecosystem: the interactive map on tablets and up; on phones a vertical
 * flow (market → Xpert → products → institutions → users) whose nodes open a
 * bottom sheet with details and links.
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
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="hidden md:block">
        <EcosystemMap labels={labels} modules={modules} />
      </div>
      <MobileFlow graph={graph} tour={tour} activeKey={null} />
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
              <h3 className="mb-3 text-[11px] font-semibold text-text-secondary">{tour.layers[l.layer]}</h3>
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
                <p className="text-[11px] font-semibold text-text-secondary">{tour.layers[open.layer]}</p>
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
                {open.cta ?? tour.explore}
              </Link>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
