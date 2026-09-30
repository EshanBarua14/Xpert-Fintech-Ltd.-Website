import type { CSSProperties } from "react";
import { MotionPause } from "@/components/motion/MotionPause";
import { Badge } from "@/components/ui/Badge";

export type FlowStep = {
  key: string;
  label: string;
  note?: string | null;
  /** The one step to emphasise (e.g. the OMS). */
  highlight?: boolean;
};

/**
 * Order-flow diagram: each step is a system, and order "packets" travel
 * left to right between them. Content (steps, title) comes from the CMS
 * WORKFLOW block; nothing here is hardcoded copy.
 *
 * Motion rules (architecture doc, section 8):
 *  - It shows a real relationship: the order passes each system in sequence.
 *  - Reduced motion: packets are removed; the numbered steps carry the meaning.
 *  - Off-screen or hidden tab: animation pauses (MotionPause).
 *  - Phones get a vertical numbered list instead of a squeezed diagram.
 */
export function OrderFlow({
  steps,
  title,
  caption,
}: {
  steps: FlowStep[];
  title: string;
  /** Shown as a badge, e.g. "Conceptual view", so it is never read as real topology. */
  caption?: string;
}) {
  const count = steps.length;
  if (count < 2) return null;

  // Geometry in SVG user units.
  const W = 1200;
  const H = 200;
  const margin = 90;
  const lineY = 92;
  const gap = (W - margin * 2) / (count - 1);
  const x = (i: number) => margin + i * gap;
  const distance = x(count - 1) - x(0);
  const packets = 4;
  // Unique ids so two diagrams on one page never share a gradient or description.
  const uid = `flow-${steps.map((s) => s.key).join("-").replace(/[^a-zA-Z0-9-]/g, "")}`;
  const duration = Math.max(6, count * 1.2);

  return (
    <figure className="flex flex-col gap-6">
      <figcaption className="flex flex-wrap items-center gap-3">
        <span className="font-display text-xl font-semibold">{title}</span>
        {caption && <Badge>{caption}</Badge>}
      </figcaption>

      {/* Desktop and tablet: horizontal diagram */}
      <MotionPause className="hidden md:block">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${uid}-desc`} className="w-full">
          <desc id={`${uid}-desc`}>{steps.map((s, i) => `${i + 1}. ${s.label}`).join(", ")}</desc>
          <defs>
            <linearGradient id={`${uid}-line`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" style={{ stopColor: "var(--color-brand-sky)", stopOpacity: 0.15 }} />
              <stop offset="50%" style={{ stopColor: "var(--color-brand-sky)", stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: "var(--color-brand-sky)", stopOpacity: 0.15 }} />
            </linearGradient>
          </defs>

          <line x1={x(0)} x2={x(count - 1)} y1={lineY} y2={lineY} stroke={`url(#${uid}-line)`} strokeWidth="2" />

          {Array.from({ length: packets }, (_, p) => (
            <circle
              key={p}
              className="flow-packet fill-cyan-300"
              cx={x(0)}
              cy={lineY}
              r="5"
              style={
                {
                  "--flow-distance": `${distance}px`,
                  "--flow-duration": `${duration}s`,
                  animationDelay: `${(p * duration) / packets}s`,
                } as CSSProperties
              }
            />
          ))}

          {steps.map((step, i) => (
            <g key={step.key}>
              <circle
                cx={x(i)}
                cy={lineY}
                r="22"
                strokeWidth={step.highlight ? 2.5 : 1.25}
                className={step.highlight ? "flow-node-pulse fill-ink-950 stroke-brand-sky" : "fill-ink-950 stroke-fg/25"}
              />
              <text
                x={x(i)}
                y={lineY + 5}
                textAnchor="middle"
                fontSize="14"
                className={step.highlight ? "font-mono fill-brand-sky" : "font-mono fill-text-secondary"}
              >
                {String(i + 1).padStart(2, "0")}
              </text>
              <text
                x={x(i)}
                y={lineY + 58}
                textAnchor="middle"
                fontSize="17"
                fontWeight="600"
                className="fill-text-primary"
              >
                {step.label}
              </text>
              {step.note && (
                <text x={x(i)} y={lineY + 82} textAnchor="middle" fontSize="14" className="fill-text-secondary">
                  {step.note}
                </text>
              )}
            </g>
          ))}
        </svg>
      </MotionPause>

      {/* Phones: vertical list, same content */}
      <ol className="flex flex-col md:hidden">
        {steps.map((step, i) => (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {i < count - 1 && <span aria-hidden="true" className="absolute top-9 bottom-0 left-[17px] w-px bg-brand-sky/30" />}
            <span
              className={
                "tabular flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs " +
                (step.highlight ? "border-brand-sky text-brand-sky" : "border-fg/25 text-text-secondary")
              }
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="flex flex-col pt-1.5">
              <span className="font-semibold">{step.label}</span>
              {step.note && <span className="text-sm text-text-secondary">{step.note}</span>}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
