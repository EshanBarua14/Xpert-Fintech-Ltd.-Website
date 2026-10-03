"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * How a brokerage house running Xpert connects to Bangladesh's capital
 * market: investors, banks, DSE, CSE, CDBL and the regulator BSEC.
 * A simplified, conceptual view (labelled as such) — it shows relationships,
 * not live data. Four scenes play in turn; in each, the Xpert modules doing
 * the work light up and link to the party they deal with. Visitors can pick
 * a scene. Motion stops for reduced-motion users and while off-screen.
 * Colours come from CSS variables (--eco-*), so it follows light/dark mode.
 *
 * XFL 2.0 additions (backward compatible — with no `modules` prop it behaves as before):
 * - `modules[key].available === false` hides a module, its links and its flows
 *   (used while a product is unpublished, e.g. eKYC). Scenes adapt automatically.
 * - Hover or keyboard focus on a module highlights the parties it works with and
 *   shows its description; Enter/click opens its product page when `href` is set.
 * - Module names can be translated via `modules[key].label`.
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
  modules?: string;
  /** Link text in the module detail, e.g. "Explore product". */
  explore?: string;
};

type NodeKey = "bsec" | "dse" | "cse" | "cdbl" | "bank" | "investors";
import type { EcosystemModuleKey } from "./ecosystem-modules";
export type { EcosystemModuleKey };
type ModuleKey = EcosystemModuleKey;

export type EcosystemModuleInfo = {
  /** Defaults to true. Set false for unpublished products. */
  available?: boolean;
  /** Display name (translated). Defaults to the key. */
  label?: string;
  /** One-sentence description shown on hover/focus. */
  description?: string;
  /** Product page, e.g. "/en/products/oms". */
  href?: string;
};

const NODE_W = 150;
const NODE_H = 62;
const NODES: Record<NodeKey, { x: number; y: number; name?: string }> = {
  bsec: { x: 400, y: 52, name: "BSEC" },
  investors: { x: 86, y: 300 },
  dse: { x: 712, y: 200, name: "DSE" },
  cse: { x: 712, y: 396, name: "CSE" },
  cdbl: { x: 570, y: 522, name: "CDBL" },
  bank: { x: 196, y: 522 },
};
const HUB = { x: 392, y: 296, r: 88 };
const RING = HUB.r + 18;

/* Each module sits on the ring facing the party it works with. */
const MODULES: { key: ModuleKey; angle: number }[] = [
  { key: "RMS", angle: -52 },
  { key: "OMS", angle: 4 },
  { key: "BO", angle: 58 },
  { key: "Back office", angle: 124 },
  { key: "eKYC", angle: 180 },
  { key: "DMS", angle: 236 },
];
const pillPos = (m: ModuleKey) => {
  const a = (MODULES.find((x) => x.key === m)!.angle * Math.PI) / 180;
  return { x: HUB.x + Math.cos(a) * RING, y: HUB.y + Math.sin(a) * RING };
};

/** Point on a node's box edge facing (px, py). */
function anchor(key: NodeKey, px: number, py: number) {
  const n = NODES[key];
  const dx = px - n.x;
  const dy = py - n.y;
  const s = Math.min(NODE_W / 2 / Math.max(Math.abs(dx), 1e-6), NODE_H / 2 / Math.max(Math.abs(dy), 1e-6));
  return { x: n.x + dx * s, y: n.y + dy * s };
}

/** Curved link from a module pill out to a party. */
function linkPath(m: ModuleKey, to: NodeKey) {
  const p = pillPos(m);
  const t = anchor(to, p.x, p.y);
  const ux = (p.x - HUB.x) / RING;
  const uy = (p.y - HUB.y) / RING;
  const c1 = { x: p.x + ux * 70, y: p.y + uy * 70 };
  const c2 = { x: t.x + (p.x - t.x) * 0.25, y: t.y + (p.y - t.y) * 0.25 };
  return `M${p.x.toFixed(1)} ${p.y.toFixed(1)} C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${t.x.toFixed(1)} ${t.y.toFixed(1)}`;
}

type Flow = {
  id: string;
  d: string;
  to: NodeKey;
  from?: NodeKey;
  both?: boolean;
  dotted?: boolean;
  /** Flow is shown only when this module is available. */
  requires?: ModuleKey;
  /** Flow is shown only when this module is NOT available (fallback path). */
  onlyWithout?: ModuleKey;
};

/** What happens in each scene: which modules work, and which flows run. */
const SCENES: { modules: ModuleKey[]; flows: Flow[] }[] = [
  {
    // Onboard: eKYC verifies the investor, BO registers the account at CDBL, DMS files the documents.
    // Without eKYC, the investor's application goes straight to the brokerage.
    modules: ["eKYC", "BO", "DMS"],
    flows: [
      { id: "ekyc-inv", d: linkPath("eKYC", "investors"), to: "investors", both: true, requires: "eKYC" },
      { id: "inv-apply", d: "M161 300 C 220 300, 262 298, 304 297", from: "investors", to: "investors", onlyWithout: "eKYC" },
      { id: "bo-cdbl", d: linkPath("BO", "cdbl"), to: "cdbl", both: true, requires: "BO" },
    ],
  },
  {
    // Trade: orders come in, RMS checks them, the OMS routes them to the exchanges.
    modules: ["RMS", "OMS"],
    flows: [
      { id: "inv-hub", d: "M161 300 C 220 300, 262 298, 304 297", from: "investors", to: "investors" },
      { id: "oms-dse", d: linkPath("OMS", "dse"), to: "dse", both: true, requires: "OMS" },
      { id: "oms-cse", d: linkPath("OMS", "cse"), to: "cse", both: true, requires: "OMS" },
    ],
  },
  {
    // Settle: exchanges settle shares at CDBL; the back office settles money with the banks.
    modules: ["Back office", "BO"],
    flows: [
      { id: "back-bank", d: linkPath("Back office", "bank"), to: "bank", both: true, requires: "Back office" },
      { id: "bo-cdbl-2", d: linkPath("BO", "cdbl"), to: "cdbl", requires: "BO" },
      { id: "dse-cdbl", d: "M770 231 C 800 330, 740 480, 645 515", from: "dse", to: "cdbl" },
      { id: "cse-cdbl", d: "M690 427 C 680 460, 660 485, 645 492", from: "cse", to: "cdbl" },
    ],
  },
  {
    // Oversee: BSEC regulates everyone; the back office and RMS produce the reports.
    modules: ["Back office", "RMS"],
    flows: [
      { id: "rms-bsec", d: linkPath("RMS", "bsec"), to: "bsec", dotted: true, requires: "RMS" },
      { id: "bsec-dse", d: "M475 52 C 580 54, 690 96, 712 169", from: "bsec", to: "dse", dotted: true },
      { id: "bsec-cse", d: "M475 60 C 700 84, 830 250, 787 384", from: "bsec", to: "cse", dotted: true },
      { id: "bsec-cdbl", d: "M462 76 C 560 170, 600 330, 585 491", from: "bsec", to: "cdbl", dotted: true },
      { id: "back-bsec", d: linkPath("Back office", "bsec"), to: "bsec", dotted: true, requires: "Back office" },
    ],
  },
];

/* Always-visible, faint base network, tagged by module so hidden modules drop out. */
const BASE: { module: ModuleKey; d: string }[] = [
  { module: "eKYC", d: linkPath("eKYC", "investors") },
  { module: "OMS", d: linkPath("OMS", "dse") },
  { module: "OMS", d: linkPath("OMS", "cse") },
  { module: "BO", d: linkPath("BO", "cdbl") },
  { module: "Back office", d: linkPath("Back office", "bank") },
];

/** Parties each module works with (used for hover/focus highlighting). */
const MODULE_PARTIES: Record<ModuleKey, NodeKey[]> = {
  RMS: ["bsec"],
  OMS: ["dse", "cse"],
  BO: ["cdbl"],
  "Back office": ["bank", "bsec"],
  eKYC: ["investors"],
  DMS: [],
};

const SCENE_MS = 5600;

export function EcosystemMap({
  labels,
  className,
  modules,
  focus,
}: {
  labels: EcosystemLabels;
  className?: string;
  modules?: Partial<Record<ModuleKey, EcosystemModuleInfo>>;
  /** Pins one module in focus (used on product pages); hover still explores the others. */
  focus?: ModuleKey;
}) {
  const router = useRouter();
  const [scene, setScene] = useState(0);
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const pinned = focus && modules?.[focus]?.available !== false ? focus : null;
  const [focusModule, setFocusModuleRaw] = useState<ModuleKey | null>(pinned);
  // Leaving a module returns to the pinned one (product pages) or to the scenes.
  const setFocusModule = (m: ModuleKey | null) => setFocusModuleRaw(m ?? pinned);
  const rootRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLAnchorElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/:/g, "");
  const titleId = `${uid}-t`;

  const isAvailable = (m: ModuleKey) => modules?.[m]?.available !== false;
  const moduleLabel = (m: ModuleKey) => modules?.[m]?.label ?? m;

  /* Scenes with unavailable modules and their flows removed. */
  const scenes = useMemo(
    () =>
      SCENES.map((s) => ({
        modules: s.modules.filter((m) => modules?.[m]?.available !== false),
        flows: s.flows.filter(
          (f) =>
            (!f.requires || modules?.[f.requires]?.available !== false) &&
            (!f.onlyWithout || modules?.[f.onlyWithout]?.available === false),
        ),
      })),
    [modules],
  );
  const visibleModules = MODULES.filter(({ key }) => isAvailable(key));

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    if (mq.matches) setAuto(false);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let visible = true;
    const apply = () => {
      const stop = !visible || document.hidden;
      setPaused(stop);
      const svg = svgRef.current;
      if (svg) {
        if (stop) svg.pauseAnimations();
        else svg.unpauseAnimations();
      }
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

  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (!auto || paused || hover || reduce || focusModule) return;
    const id = setTimeout(() => setScene((s) => (s + 1) % 4), SCENE_MS);
    return () => clearTimeout(id);
  }, [scene, auto, paused, hover, reduce, focusModule]);

  const current = scenes[scene]!;
  const activeModules = new Set<ModuleKey>(focusModule ? [focusModule] : current.modules);
  const activeNodes = new Set<string>(
    focusModule ? MODULE_PARTIES[focusModule] : current.flows.flatMap((f) => [f.to, f.from ?? ""]),
  );
  const focusInfo = focusModule ? modules?.[focusModule] : undefined;

  const openModule = (m: ModuleKey) => {
    const href = modules?.[m]?.href;
    if (href) router.push(href);
  };
  const onPillKey = (e: KeyboardEvent<SVGGElement>, m: ModuleKey) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModule(m);
    } else if (e.key === "Escape") {
      setFocusModule(null);
      (e.currentTarget as SVGGElement).blur();
    }
  };

  const node = (key: NodeKey, title: string) => {
    const n = NODES[key];
    const on = activeNodes.has(key);
    return (
      <g key={key} className="transition-opacity duration-500" opacity={on ? 1 : 0.5}>
        {on && <rect x={n.x - NODE_W / 2 - 8} y={n.y - NODE_H / 2 - 8} width={NODE_W + 16} height={NODE_H + 16} rx={22} fill="url(#eco-glow)" />}
        <rect
          x={n.x - NODE_W / 2}
          y={n.y - NODE_H / 2}
          width={NODE_W}
          height={NODE_H}
          rx={16}
          style={{ fill: "var(--eco-node)", stroke: on ? "var(--eco-accent)" : "var(--eco-line)" }}
          strokeWidth={on ? 1.6 : 1}
          className="transition-[stroke] duration-500"
        />
        <text x={n.x} y={n.y - 3} textAnchor="middle" style={{ fill: "var(--eco-text)" }} className="eco-name font-display text-[21px] font-semibold">
          {title}
        </text>
        <text x={n.x} y={n.y + 19} textAnchor="middle" style={{ fill: "var(--eco-muted)" }} className="eco-role text-[12.5px]">
          {labels.roles[key]}
        </text>
      </g>
    );
  };

  return (
    <div
      ref={rootRef}
      className={cn("flex flex-col gap-5", className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setFocusModule(null);
      }}
    >
      <div className="relative">
        <svg ref={svgRef} viewBox="0 0 800 580" role="img" aria-labelledby={titleId} className="h-auto w-full overflow-visible">
          <title id={titleId}>{labels.aria}</title>
          <defs>
            <radialGradient id="eco-glow">
              <stop offset="0" style={{ stopColor: "var(--eco-glow)" }} />
              <stop offset="1" stopColor="rgb(34 188 235)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="eco-hub" cx="50%" cy="35%">
              <stop offset="0" style={{ stopColor: "var(--eco-hub-a)" }} />
              <stop offset="1" style={{ stopColor: "var(--eco-hub-b)" }} />
            </radialGradient>
            <radialGradient id="eco-packet">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.4" stopColor="#67e8f9" />
              <stop offset="1" stopColor="rgb(34 188 235)" stopOpacity="0" />
            </radialGradient>
            {current.flows.map((f) => (
              <path key={f.id} id={`${uid}-${scene}-${f.id}`} d={f.d} />
            ))}
          </defs>

          {/* Base network */}
          {BASE.filter((b) => isAvailable(b.module)).map((b, i) => (
            <path
              key={i}
              d={b.d}
              fill="none"
              strokeWidth={focusModule === b.module ? 2 : 1.2}
              style={{ stroke: focusModule === b.module ? "var(--eco-accent)" : "var(--eco-line)" }}
              className="transition-[stroke] duration-300"
            />
          ))}

          {/* Active flows (hidden while a module is focused, so its links stand out) */}
          {!focusModule &&
            current.flows.map((f) => (
              <use
                key={`${scene}-${f.id}`}
                href={`#${uid}-${scene}-${f.id}`}
                fill="none"
                strokeWidth={2}
                strokeDasharray={f.dotted ? "4 6" : undefined}
                strokeLinecap="round"
                className="eco-flow-in"
                style={{ stroke: f.dotted ? "var(--eco-oversight)" : "var(--eco-flow)" }}
              />
            ))}

          {!reduce &&
            !focusModule &&
            current.flows.flatMap((f) => {
              const dirs = f.both ? [false, true] : [false];
              return dirs.flatMap((rev) =>
                [0, 1].map((k) => (
                  <circle key={`${scene}-${f.id}-${rev}-${k}`} r={f.dotted ? 4 : 6} fill="url(#eco-packet)">
                    <animateMotion
                      dur={f.dotted ? "3.2s" : "2.3s"}
                      begin={`${k * (f.dotted ? 1.6 : 1.15) + (rev ? 0.55 : 0)}s`}
                      repeatCount="indefinite"
                      keyPoints={rev ? "1;0" : "0;1"}
                      keyTimes="0;1"
                      calcMode="linear"
                    >
                      <mpath href={`#${uid}-${scene}-${f.id}`} />
                    </animateMotion>
                  </circle>
                )),
              );
            })}

          {/* Brokerage house running Xpert */}
          <g>
            <circle cx={HUB.x} cy={HUB.y} r={HUB.r + 40} fill="url(#eco-glow)" />
            <circle
              cx={HUB.x}
              cy={HUB.y}
              r={RING}
              fill="none"
              strokeDasharray="2 10"
              style={{ stroke: "var(--eco-accent)", transformOrigin: `${HUB.x}px ${HUB.y}px`, opacity: 0.5 }}
              className={reduce ? undefined : "eco-spin"}
            />
            <circle cx={HUB.x} cy={HUB.y} r={HUB.r} fill="url(#eco-hub)" stroke="#22bceb" strokeWidth={1.5} />
            <text x={HUB.x} y={HUB.y - 8} textAnchor="middle" className="eco-hub-text fill-white font-display text-[16px] font-semibold">
              {labels.hub}
            </text>
            <text x={HUB.x} y={HUB.y + 16} textAnchor="middle" className="eco-hub-sub fill-[#9ff0ff] text-[12.5px] font-semibold">
              {labels.hubSub}
            </text>

            {visibleModules.map(({ key }) => {
              const { x, y } = pillPos(key);
              const on = activeModules.has(key);
              const text = moduleLabel(key);
              const w = text.length * 7.4 + 22;
              const info = modules?.[key];
              return (
                <g
                  key={key}
                  className="eco-role cursor-pointer outline-none transition-opacity duration-500 focus-visible:[&>rect:last-of-type]:stroke-[3]"
                  opacity={on ? 1 : focusModule ? 0.3 : 0.55}
                  tabIndex={0}
                  role={info?.href ? "link" : "button"}
                  aria-label={info?.description ? `${text}: ${info.description}` : text}
                  data-module={key}
                  onMouseEnter={() => setFocusModule(key)}
                  onFocus={() => setFocusModule(key)}
                  onBlur={(e) => {
                    // Keep the detail open when focus moves to its "Explore" link.
                    if (e.relatedTarget !== exploreRef.current) setFocusModule(null);
                  }}
                  onClick={() => openModule(key)}
                  onKeyDown={(e) => onPillKey(e, key)}
                >
                  {/* Larger invisible hit area for touch */}
                  <rect x={x - w / 2 - 6} y={y - 18} width={w + 12} height={36} fill="transparent" />
                  {on && !reduce && (
                    <rect x={x - w / 2} y={y - 12} width={w} height={24} rx={12} fill="none" stroke="#67e8f9" className="eco-pill-pulse" />
                  )}
                  <rect
                    x={x - w / 2}
                    y={y - 12}
                    width={w}
                    height={24}
                    rx={12}
                    style={{ fill: on ? "var(--eco-pill-on)" : "var(--eco-pill)", stroke: on ? "#67e8f9" : "var(--eco-line)" }}
                    strokeWidth={on ? 1.5 : 1}
                  />
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    style={{ fill: on ? "#ffffff" : "var(--eco-pill-text)" }}
                    className="pointer-events-none font-mono text-[11px] font-semibold"
                  >
                    {text}
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
                setFocusModuleRaw(null);
              }}
              className={cn(
                "relative overflow-hidden rounded-full border px-2 py-2 text-xs font-semibold transition-colors sm:text-sm",
                scene === i ? "border-brand-sky/60 bg-brand-sky/10 text-fg" : "border-fg/10 text-text-secondary hover:text-fg",
              )}
            >
              <span className="relative z-10">
                <span className="mr-1.5 font-mono text-accent">{i + 1}</span>
                {s}
              </span>
              {scene === i && auto && !reduce && (
                <span
                  key={`p-${scene}`}
                  aria-hidden="true"
                  className="eco-progress absolute inset-y-0 left-0 bg-brand-sky/15"
                  style={{ animationDuration: `${SCENE_MS}ms`, animationPlayState: paused || hover || focusModule ? "paused" : "running" }}
                />
              )}
            </button>
          ))}
        </div>
        <p className="min-h-[3.5rem] text-sm leading-relaxed text-text-secondary md:text-base" aria-live="polite">
          {focusModule ? (
            <>
              <span className="mr-2 inline-flex align-middle">
                <span className="rounded-full border border-brand-sky/40 bg-brand-sky/10 px-2 py-0.5 font-mono text-[11px] text-accent">
                  {moduleLabel(focusModule)}
                </span>
              </span>
              {focusInfo?.description}
              {focusInfo?.href && (
                <>
                  {" "}
                  <Link
                    ref={exploreRef}
                    href={focusInfo.href}
                    onBlur={() => setFocusModule(null)}
                    className="font-semibold text-accent underline-offset-4 hover:underline">
                    {labels.explore ?? "Explore product"} →
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <span className="mr-2 inline-flex flex-wrap gap-1 align-middle">
                {current.modules.map((m) => (
                  <span key={m} className="rounded-full border border-brand-sky/40 bg-brand-sky/10 px-2 py-0.5 font-mono text-[11px] text-accent">
                    {moduleLabel(m)}
                  </span>
                ))}
              </span>
              {labels.sceneText[scene]}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
