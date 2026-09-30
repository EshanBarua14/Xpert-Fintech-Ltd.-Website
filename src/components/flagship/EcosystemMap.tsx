"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * How a brokerage house running Xpert connects to Bangladesh's capital
 * market: investors, banks, DSE, CSE, CDBL and the regulator BSEC.
 * A simplified, conceptual view (labelled as such) — it shows relationships,
 * not live data. Four scenes play in turn; visitors can pick one. Motion
 * stops for reduced-motion users and while the diagram is off-screen.
 */

export type EcosystemLabels = {
  caption: string;
  aria: string;
  scenes: [string, string, string, string];
  sceneText: [string, string, string, string];
  hub: string;
  hubSub: string;
  roles: { bsec: string; dse: string; cse: string; cdbl: string; bank: string; investors: string };
  names: { bank: string; investors: string };
};

type NodeKey = "bsec" | "dse" | "cse" | "cdbl" | "bank" | "investors";
type Edge = { id: string; d: string; scenes: number[]; from: NodeKey | "hub"; to: NodeKey | "hub"; both?: boolean; dotted?: boolean };

const NODES: Record<NodeKey, { x: number; y: number; name?: string }> = {
  bsec: { x: 400, y: 58, name: "BSEC" },
  investors: { x: 86, y: 300 },
  dse: { x: 712, y: 206, name: "DSE" },
  cse: { x: 712, y: 382, name: "CSE" },
  cdbl: { x: 560, y: 512, name: "CDBL" },
  bank: { x: 196, y: 512 },
};
const HUB = { x: 392, y: 296, r: 92 };

const EDGES: Edge[] = [
  // Scene 0 — onboard
  { id: "inv-hub", d: "M161 300 C 220 300, 260 298, 300 297", scenes: [0, 1], from: "investors", to: "hub" },
  { id: "hub-cdbl", d: "M444 372 C 470 430, 520 460, 548 481", scenes: [0, 2], from: "hub", to: "cdbl", both: true },
  // Scene 1 — trade
  { id: "hub-dse", d: "M470 250 C 540 220, 590 206, 637 206", scenes: [1], from: "hub", to: "dse", both: true },
  { id: "hub-cse", d: "M470 342 C 540 370, 590 382, 637 382", scenes: [1], from: "hub", to: "cse", both: true },
  // Scene 2 — settle
  { id: "dse-cdbl", d: "M760 237 C 790 330, 730 470, 635 505", scenes: [2], from: "dse", to: "cdbl" },
  { id: "cse-cdbl", d: "M690 413 C 680 445, 650 470, 622 481", scenes: [2], from: "cse", to: "cdbl" },
  { id: "hub-bank", d: "M341 372 C 300 420, 240 450, 210 481", scenes: [2], from: "hub", to: "bank", both: true },
  // Scene 3 — oversee (drawn only while active)
  { id: "bsec-hub", d: "M400 89 L 394 204", scenes: [3], from: "bsec", to: "hub", dotted: true },
  { id: "bsec-dse", d: "M475 58 C 580 60, 690 100, 712 175", scenes: [3], from: "bsec", to: "dse", dotted: true },
  { id: "bsec-cse", d: "M475 66 C 700 90, 830 250, 787 370", scenes: [3], from: "bsec", to: "cse", dotted: true },
  { id: "bsec-cdbl", d: "M462 80 C 560 170, 590 320, 575 481", scenes: [3], from: "bsec", to: "cdbl", dotted: true },
];

const MODULES = ["OMS", "RMS", "eKYC", "BO", "DMS", "Back office"];
const SCENE_MS = 5200;

export function EcosystemMap({ labels, className }: { labels: EcosystemLabels; className?: string }) {
  const [scene, setScene] = useState(0);
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/:/g, "");
  const titleId = `${uid}-t`;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    if (mq.matches) setAuto(false);
  }, []);

  // Pause scene changes and packet motion while off-screen or the tab is hidden.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let visible = true;
    const apply = () => {
      const stop = !visible || document.hidden;
      setPaused(stop);
      const svg = svgRef.current;
      if (svg) (stop ? svg.pauseAnimations() : svg.unpauseAnimations());
    };
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      apply();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", apply);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", apply);
    };
  }, []);

  useEffect(() => {
    if (!auto || paused || reduce) return;
    const id = setTimeout(() => setScene((s) => (s + 1) % 4), SCENE_MS);
    return () => clearTimeout(id);
  }, [scene, auto, paused, reduce]);

  const activeEdges = EDGES.filter((e) => e.scenes.includes(scene));
  const activeNodes = new Set<string>(activeEdges.flatMap((e) => [e.from, e.to]));

  const node = (key: NodeKey, title: string) => {
    const n = NODES[key];
    const on = activeNodes.has(key);
    const w = 150;
    const h = 62;
    return (
      <g key={key} className="transition-opacity duration-500" opacity={on ? 1 : 0.55}>
        {on && <rect x={n.x - w / 2 - 6} y={n.y - h / 2 - 6} width={w + 12} height={h + 12} rx={20} fill="url(#eco-glow)" />}
        <rect
          x={n.x - w / 2}
          y={n.y - h / 2}
          width={w}
          height={h}
          rx={16}
          fill="rgb(10 20 40 / 0.9)"
          stroke={on ? "#67e8f9" : "rgb(255 255 255 / 0.14)"}
          strokeWidth={on ? 1.5 : 1}
          className="transition-[stroke] duration-500"
        />
        <text x={n.x} y={n.y - 3} textAnchor="middle" className="eco-name fill-white font-display text-[21px] font-semibold">
          {title}
        </text>
        <text x={n.x} y={n.y + 19} textAnchor="middle" className="eco-role fill-[#9aa7ba] text-[12.5px]">
          {labels.roles[key]}
        </text>
      </g>
    );
  };

  return (
    <div ref={rootRef} className={cn("flex flex-col gap-5", className)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative">
        <svg ref={svgRef} viewBox="0 0 800 570" role="img" aria-labelledby={titleId} className="h-auto w-full overflow-visible">
          <title id={titleId}>{labels.aria}</title>
          <defs>
            <radialGradient id="eco-glow">
              <stop offset="0" stopColor="rgb(34 188 235 / 0.35)" />
              <stop offset="1" stopColor="rgb(34 188 235 / 0)" />
            </radialGradient>
            <radialGradient id="eco-hub" cx="50%" cy="40%">
              <stop offset="0" stopColor="#1d4f9a" />
              <stop offset="1" stopColor="#0a1428" />
            </radialGradient>
            <radialGradient id="eco-packet">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.4" stopColor="#67e8f9" />
              <stop offset="1" stopColor="rgb(34 188 235 / 0)" />
            </radialGradient>
            {EDGES.map((e) => (
              <path key={e.id} id={`${uid}-${e.id}`} d={e.d} />
            ))}
          </defs>

          {/* Connections */}
          {EDGES.map((e) => {
            const on = e.scenes.includes(scene);
            if (e.dotted && !on) return null;
            return (
              <use
                key={e.id}
                href={`#${uid}-${e.id}`}
                fill="none"
                stroke={on ? (e.dotted ? "#8fb4ff" : "#22bceb") : "rgb(255 255 255 / 0.09)"}
                strokeWidth={on ? 2 : 1.25}
                strokeDasharray={e.dotted ? "4 6" : undefined}
                strokeLinecap="round"
                className="transition-[stroke] duration-500"
              />
            );
          })}

          {/* Travelling packets on the active connections */}
          {!reduce &&
            activeEdges.flatMap((e) => {
              const dirs = e.both ? [false, true] : [false];
              return dirs.flatMap((rev) =>
                [0, 1].map((k) => (
                  <circle key={`${scene}-${e.id}-${rev}-${k}`} r={e.dotted ? 4 : 6} fill="url(#eco-packet)">
                    <animateMotion
                      dur={e.dotted ? "3.2s" : "2.4s"}
                      begin={`${k * (e.dotted ? 1.6 : 1.2) + (rev ? 0.6 : 0)}s`}
                      repeatCount="indefinite"
                      keyPoints={rev ? "1;0" : "0;1"}
                      keyTimes="0;1"
                      calcMode="linear"
                    >
                      <mpath href={`#${uid}-${e.id}`} />
                    </animateMotion>
                  </circle>
                )),
              );
            })}

          {/* Brokerage house running Xpert */}
          <g>
            <circle cx={HUB.x} cy={HUB.y} r={HUB.r + 34} fill="url(#eco-glow)" />
            <circle
              cx={HUB.x}
              cy={HUB.y}
              r={HUB.r + 16}
              fill="none"
              stroke="rgb(103 232 249 / 0.35)"
              strokeDasharray="2 10"
              className={reduce ? undefined : "eco-spin"}
              style={{ transformOrigin: `${HUB.x}px ${HUB.y}px` }}
            />
            <circle cx={HUB.x} cy={HUB.y} r={HUB.r} fill="url(#eco-hub)" stroke="#22bceb" strokeWidth={1.5} />
            <text x={HUB.x} y={HUB.y - 8} textAnchor="middle" className="eco-hub-text fill-white font-display text-[16px] font-semibold">
              {labels.hub}
            </text>
            <text x={HUB.x} y={HUB.y + 16} textAnchor="middle" className="eco-hub-sub fill-[#67e8f9] text-[12.5px] font-semibold">
              {labels.hubSub}
            </text>
            {MODULES.map((m, i) => {
              const a = (-90 + (360 / MODULES.length) * i + 30) * (Math.PI / 180);
              const x = HUB.x + Math.cos(a) * (HUB.r + 16);
              const y = HUB.y + Math.sin(a) * (HUB.r + 16);
              const w = m.length * 7.2 + 18;
              return (
                <g key={m} className="eco-role">
                  <rect x={x - w / 2} y={y - 11} width={w} height={22} rx={11} fill="#0a1428" stroke="rgb(103 232 249 / 0.45)" />
                  <text x={x} y={y + 4} textAnchor="middle" className="fill-[#cfefff] font-mono text-[10.5px]">
                    {m}
                  </text>
                </g>
              );
            })}
          </g>

          {node("bsec", NODES.bsec.name!)}
          {node("investors", labels.names.investors)}
          {node("dse", NODES.dse.name!)}
          {node("cse", NODES.cse.name!)}
          {node("cdbl", NODES.cdbl.name!)}
          {node("bank", labels.names.bank)}
        </svg>
        <span className="glass absolute top-0 right-0 rounded-full px-3 py-1 text-xs text-text-secondary">{labels.caption}</span>
      </div>

      {/* Scene picker and explanation */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-2" role="group" aria-label={labels.caption}>
          {labels.scenes.map((s, i) => (
            <button
              key={s}
              type="button"
              aria-pressed={scene === i}
              onClick={() => {
                setScene(i);
                setAuto(false);
              }}
              className={cn(
                "relative overflow-hidden rounded-full border px-2 py-2 text-xs font-semibold transition-colors sm:text-sm",
                scene === i ? "border-brand-sky/60 bg-brand-sky/10 text-white" : "border-white/10 text-text-secondary hover:text-white",
              )}
            >
              <span className="relative z-10">
                <span className="mr-1.5 font-mono text-cyan-300">{i + 1}</span>
                {s}
              </span>
              {scene === i && auto && !reduce && (
                <span
                  key={`p-${scene}`}
                  aria-hidden="true"
                  className="eco-progress absolute inset-y-0 left-0 bg-brand-sky/15"
                  style={{ animationDuration: `${SCENE_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                />
              )}
            </button>
          ))}
        </div>
        <p className="min-h-[3.5rem] text-sm leading-relaxed text-text-secondary md:text-base">{labels.sceneText[scene]}</p>
      </div>
    </div>
  );
}
