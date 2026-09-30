import type { CSSProperties } from "react";

/**
 * Small looping illustrations for the capability cards. Purely decorative
 * (aria-hidden) and deliberately abstract: no prices, volumes or other
 * figures that could be mistaken for market data.
 */
export type VisualKind = "trading" | "risk" | "ekyc" | "bo" | "dms" | "back" | "data";

const v = (vars: Record<string, string | number>) => vars as CSSProperties;

function Trading() {
  // Orders travelling along three lanes into the OMS node.
  const lanes = [0, 1, 2, 3];
  return (
    <div className="relative h-full min-h-44 w-full overflow-hidden">
      <div className="absolute inset-y-6 right-6 flex w-24 items-center justify-center rounded-2xl border border-brand-sky/40 bg-brand-sky/10 font-mono text-xs tracking-widest text-cyan-300 shadow-[0_0_40px_-8px_rgb(34_188_235/0.6)]">
        OMS
      </div>
      {lanes.map((i) => (
        <div key={i} className="absolute left-4 right-32 h-px bg-gradient-to-r from-transparent via-fg/15 to-fg/5" style={{ top: `${22 + i * 19}%` }}>
          {[0, 1].map((k) => (
            <span
              key={k}
              className="absolute -top-[3px] h-[7px] w-10 rounded-full bg-gradient-to-r from-transparent to-cyan-300"
              style={{ animation: `lane ${3.2 + i * 0.5}s linear ${k * 1.7 + i * 0.4}s infinite` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Risk() {
  return (
    <div className="relative flex h-full min-h-36 items-center justify-center">
      <svg viewBox="0 0 200 120" className="w-56 max-w-full">
        <path d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M20 110 A80 80 0 0 1 180 110"
          fill="none"
          stroke="url(#risk-g)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray="252"
          style={v({ "--gauge-from": 200, "--gauge-to": 90, animation: "gauge 5s ease-in-out infinite" })}
        />
        <defs>
          <linearGradient id="risk-g" x1="0" x2="1">
            <stop offset="0" stopColor="#2a5fae" />
            <stop offset="1" stopColor="#67e8f9" />
          </linearGradient>
        </defs>
        <path d="M100 58l16 7v10c0 9-6 15-16 19-10-4-16-10-16-19V65z" fill="rgb(34 188 235 / 0.12)" stroke="#67e8f9" strokeWidth="1.5" />
        <path d="M93 76l5 5 9-10" fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Ekyc() {
  return (
    <div className="relative flex h-full min-h-36 items-center justify-center">
      <div className="relative h-24 w-40 overflow-hidden rounded-xl border border-fg/15 bg-fg/[0.04] p-3">
        <div className="flex gap-3">
          <div className="h-12 w-10 rounded-md bg-gradient-to-b from-brand-sky/40 to-brand-royal/30" />
          <div className="flex flex-1 flex-col gap-1.5 pt-1">
            <span className="h-1.5 w-full rounded bg-fg/20" />
            <span className="h-1.5 w-3/4 rounded bg-fg/15" />
            <span className="h-1.5 w-1/2 rounded bg-fg/10" />
          </div>
        </div>
        <span
          className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-transparent via-cyan-300/50 to-transparent"
          style={v({ "--scan": "96px", animation: "scan-y 2.8s ease-in-out infinite" })}
        />
      </div>
    </div>
  );
}

function Bo() {
  return (
    <div className="flex h-full min-h-36 items-center justify-center gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="block size-3 rounded-full" style={{ animation: `fill-step 5s ease-in-out ${i * 0.5}s infinite` }} />
          {i < 4 && <span className="block h-px w-6 bg-fg/15" />}
        </span>
      ))}
    </div>
  );
}

function Dms() {
  return (
    <div className="relative flex h-full min-h-36 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute h-24 w-20 rounded-lg border border-fg/15 bg-navy-800/90 p-2 transition-transform duration-500 group-hover:translate-x-[var(--dx)] group-hover:rotate-[var(--rot)]"
          style={v({ "--dx": `${(i - 1) * 34}px`, "--rot": `${(i - 1) * 8}deg`, transform: `rotate(${(i - 1) * 4}deg)` })}
        >
          <span className="mb-1.5 block h-1.5 w-2/3 rounded bg-brand-sky/50" />
          <span className="mb-1 block h-1 w-full rounded bg-fg/15" />
          <span className="mb-1 block h-1 w-5/6 rounded bg-fg/10" />
          <span className="block h-1 w-3/4 rounded bg-fg/10" />
        </div>
      ))}
    </div>
  );
}

function Back() {
  return (
    <div className="flex h-full min-h-36 flex-col justify-center gap-2 px-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-brand-sky/60" />
          <span className="shimmer-row h-2 flex-1 rounded" style={{ animationDelay: `${i * 0.35}s` }} />
          <span className="h-2 w-10 rounded bg-fg/10" />
        </div>
      ))}
    </div>
  );
}

function Data() {
  // Abstract signal lines (no axes, no values).
  return (
    <div className="flex h-full min-h-36 items-center">
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="h-28 w-full">
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M0 ${70 + i * 8} C 60 ${30 + i * 20}, 110 ${100 - i * 10}, 170 ${60 + i * 6} S 290 ${20 + i * 18}, 400 ${50 + i * 10}`}
            fill="none"
            stroke={i === 0 ? "#67e8f9" : i === 1 ? "#22bceb" : "#2a5fae"}
            strokeOpacity={1 - i * 0.3}
            strokeWidth={i === 0 ? 2 : 1.25}
            strokeDasharray="600"
            style={v({ "--len": 600, animation: `draw-line 4s ease-out ${i * 0.4}s infinite alternate` })}
          />
        ))}
      </svg>
    </div>
  );
}

export function CapabilityVisual({ kind }: { kind: VisualKind }) {
  const map = { trading: Trading, risk: Risk, ekyc: Ekyc, bo: Bo, dms: Dms, back: Back, data: Data } as const;
  const C = map[kind];
  return (
    <div aria-hidden="true" className="relative h-full w-full">
      <C />
    </div>
  );
}
