"use client";

import Image from "next/image";
import { ContactIcon, type ContactLabels } from "@/components/people/ContactIcon";
import { Icon } from "@/components/ui/Icon";
import { RankBadge, type RankLabels } from "./RankBadge";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { ConsortiumMember } from "@/lib/public/consortium";
import { cn } from "@/lib/utils/cn";
import { monogram } from "./LogoWall";

export type ConsortiumLabels = {
  title: string;
  body: string;
  hub: string;
  pick: string;
  pickBody: string;
  shareholder: string;
  boardSeat: string;
  consultant: string;
  appLive: string;
  representedBy: string;
  /** "{title}, Xpert Fintech Ltd.": the representative's position at Xpert Fintech. */
  roleAtXpert?: string;
  apps: string;
  noApp: string;
  noRep: string;
  /** Placeholder card when a house has no representative on file: "Representative to be announced". */
  repPending?: string;
  /** Gold line under a representative with no seat at Xpert Fintech ("Representative"). */
  representative?: string;
  website: string;
  /** LinkedIn and email icons beside each representative. */
  contact?: ContactLabels;
  android: string;
  ios: string;
  web: string;
  legendSeat: string;
  legendApp: string;
  legendOwns: string;
  allMembers: string;
  boardHref: string;
  consultantsHref: string;
  viewProfile: string;
  play: string;
  pause: string;
  next: string;
  prev: string;
  autoHint: string;
  dseTrec: string;
  cseTrec: string;
  visitWebsite: string;
  rank?: RankLabels;
};

/** How long each house stays on screen while the map plays by itself. */
const DWELL_MS = 6500;
/** After a visitor picks a house, the tour waits this long before carrying on. */
const RESUME_MS = 14000;

/* Geometry of the map (SVG user units). */
const SIZE = 640;
const C = SIZE / 2;
const HUB_R = 74;
const RING = 236;
const PLATE_W = 96;
const PLATE_H = 54;
const MARK_R = 296;

function place(i: number, n: number, r: number) {
  const a = (-90 + (360 / n) * i) * (Math.PI / 180);
  const round = (v: number) => Math.round(v * 10) / 10; // same on server and browser
  return { x: round(C + Math.cos(a) * r), y: round(C + Math.sin(a) * r), a };
}

/** Where a straight line from the hub meets a member's logo plate. */
function plateEdge(px: number, py: number) {
  const dx = C - px;
  const dy = C - py;
  const s = Math.min(PLATE_W / 2 / Math.max(Math.abs(dx), 1e-6), PLATE_H / 2 / Math.max(Math.abs(dy), 1e-6));
  return { x: px + dx * s, y: py + dy * s };
}

/**
 * The consortium as a map: Xpert Fintech in the middle, every member brokerage
 * house around it. A gold mark outside a house means it has a seat on Xpert Fintech's
 * board (or a consultant), a blue one that its branded trading app runs on
 * Xpert Fintech's platform. Choosing a house (click, tap, keyboard, or the list) lights
 * its line — ownership flowing in, the platform flowing out — and shows who
 * represents it and which app it runs. Until someone chooses, the map steps
 * through the houses slowly; reduced motion keeps it still.
 */
export function ConsortiumExplorer({ members, labels, locale }: { members: ConsortiumMember[]; labels: ConsortiumLabels; locale: "en" | "bn" }) {
  const n = members.length;
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hold, setHold] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const elapsed = useRef(0);
  const waitUntil = useRef(0);
  const nf = (v: number) => new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(v);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    // With reduced motion the map does not move by itself; the visitor steps through it.
    if (mq.matches) setPlaying(false);
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { threshold: 0.2 });
    if (rootRef.current) io.observe(rootRef.current);
    return () => io.disconnect();
  }, []);

  // The tour: each house for a few seconds, then the next. It waits while the pointer
  // or keyboard focus is on the map, while it is off screen, and for a while after a choice.
  useEffect(() => {
    if (!playing || n < 2) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      const waiting = hold || !visible || document.hidden || Date.now() < waitUntil.current;
      if (!waiting) elapsed.current += dt;
      if (barRef.current) barRef.current.style.transform = `scaleX(${Math.min(1, elapsed.current / DWELL_MS)})`;
      if (elapsed.current >= DWELL_MS) {
        elapsed.current = 0;
        setActive((a) => (a + 1) % n);
      }
    }, 80);
    return () => clearInterval(id);
  }, [playing, hold, visible, n]);

  const choose = (i: number) => {
    setActive(((i % n) + n) % n);
    elapsed.current = 0;
    waitUntil.current = Date.now() + RESUME_MS;
    if (barRef.current) barRef.current.style.transform = "scaleX(0)";
  };
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(i);
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      choose(i + 1);
      document.getElementById(`cx-node-${(i + 1) % n}`)?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      choose(i - 1);
      document.getElementById(`cx-node-${(i - 1 + n) % n}`)?.focus();
    }
  };

  const m = members[active] ?? null;

  return (
    <div
      ref={rootRef}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocusCapture={(e) => (e.target as Element).matches?.(":focus-visible") && setHold(true)}
      onBlurCapture={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHold(false)}
      className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start"
    >
      {/* The map */}
      <div className="flex flex-col gap-4">
        <div className="relative mx-auto w-full max-w-[40rem]">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="group" aria-label={labels.title} className="h-auto w-full overflow-visible">
            <defs>
              <radialGradient id="cx-hub" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#0b1a33" stopOpacity="0.95" />
              </radialGradient>
            </defs>
            {/* Orbit rings */}
            <circle cx={C} cy={C} r={RING} fill="none" className="stroke-fg/10" strokeDasharray="2 7" />
            <circle cx={C} cy={C} r={MARK_R} fill="none" className="stroke-fg/[0.06]" />

            {/* Lines: every house to Xpert Fintech */}
            {members.map((x, i) => {
              const p = place(i, n, RING);
              const e = plateEdge(p.x, p.y);
              const on = active === i;
              const d = `M${e.x.toFixed(1)} ${e.y.toFixed(1)} L${(C + ((p.x - C) / RING) * HUB_R).toFixed(1)} ${(C + ((p.y - C) / RING) * HUB_R).toFixed(1)}`;
              return (
                <g key={`l-${x.id}`}>
                  <path id={`cx-path-${i}`} d={d} fill="none" strokeLinecap="round" className={cn("transition-[stroke,stroke-width,opacity] duration-500", on ? "stroke-brand-sky" : "stroke-fg/15")} strokeWidth={on ? 2.5 : 1.2} strokeDasharray={on ? undefined : "3 6"} />
                  {on && !reduce && (
                    <>
                      {/* Ownership flows in (gold), the platform flows out (blue). */}
                      <circle r={4.5} className="fill-gold">
                        <animateMotion dur="1.8s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
                          <mpath href={`#cx-path-${i}`} />
                        </animateMotion>
                      </circle>
                      <circle r={4.5} className="fill-brand-sky">
                        <animateMotion dur="1.8s" begin="0.9s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                          <mpath href={`#cx-path-${i}`} />
                        </animateMotion>
                      </circle>
                    </>
                  )}
                </g>
              );
            })}

            {/* Xpert Fintech in the middle */}
            <g>
              <circle cx={C} cy={C} r={HUB_R + 16} className="fill-brand-sky/[0.06]" />
              <circle cx={C} cy={C} r={HUB_R} fill="url(#cx-hub)" className="stroke-brand-sky/60" strokeWidth={1.5} />
              <image href="/brand/xpert-logo.png" x={C - 30} y={C - 44} width={60} height={60} preserveAspectRatio="xMidYMid meet" />
              <text x={C} y={C + 36} textAnchor="middle" className="fill-white font-display text-[18px] font-semibold">
                {labels.hub}
              </text>
            </g>

            {/* The houses */}
            {members.map((x, i) => {
              const p = place(i, n, RING);
              const on = active === i;
              const seat = x.reps.some((r) => r.group === "BOARD");
              const consult = !seat && x.reps.length > 0;
              const mark = place(i, n, MARK_R);
              // Two small marks side by side, along the outer ring.
              const side = { x: -Math.sin(mark.a) * 14, y: Math.cos(mark.a) * 14 };
              return (
                <g
                  key={x.id}
                  id={`cx-node-${i}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={on}
                  aria-label={`${x.name}${seat ? ` — ${labels.boardSeat}` : ""}${x.apps.length ? ` — ${labels.appLive}` : ""}`}
                  onClick={() => choose(i)}
                  onKeyDown={(e) => onKey(e, i)}
                  style={{ transform: on ? "scale(1.12)" : "scale(1)", transformOrigin: `${p.x}px ${p.y}px`, transition: reduce ? undefined : "transform 450ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                  className="cursor-pointer outline-none [&:focus-visible>rect.cx-plate]:stroke-brand-sky [&:focus-visible>rect.cx-plate]:stroke-[3]"
                >
                  {/* Three marks along the outer ring: shareholder (every member), board member, branded app */}
                  <circle cx={mark.x - side.x} cy={mark.y - side.y} r={6} className="fill-[#22b57a]" />
                  {(seat || consult) && <circle cx={mark.x} cy={mark.y} r={6} className={consult ? "fill-gold/50" : "fill-gold"} />}
                  {x.apps.length > 0 && <circle cx={mark.x + side.x} cy={mark.y + side.y} r={6} className="fill-brand-sky" />}
                  <rect
                    className={cn("cx-plate transition-[stroke,stroke-width] duration-300", on ? "stroke-brand-sky" : "stroke-black/10")}
                    x={p.x - PLATE_W / 2}
                    y={p.y - PLATE_H / 2}
                    width={PLATE_W}
                    height={PLATE_H}
                    rx={14}
                    fill="#ffffff"
                    strokeWidth={on ? 3 : 1}
                  />
                  {on && <rect x={p.x - PLATE_W / 2 - 7} y={p.y - PLATE_H / 2 - 7} width={PLATE_W + 14} height={PLATE_H + 14} rx={19} fill="none" className="stroke-brand-sky/40" strokeWidth={6} />}
                  {x.logo ? (
                    <image href={x.logo.url} x={p.x - PLATE_W / 2 + 8} y={p.y - PLATE_H / 2 + 7} width={PLATE_W - 16} height={PLATE_H - 14} preserveAspectRatio="xMidYMid meet" />
                  ) : (
                    <text x={p.x} y={p.y + 5} textAnchor="middle" className="fill-[#0b1a33] font-mono text-[14px] font-semibold">
                      {monogram(x.name, x.shortName)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        {/* Legend */}
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-secondary">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-[#22b57a]" />
            {labels.shareholder}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-gold" />
            {labels.legendSeat}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-brand-sky" />
            {labels.legendApp}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-px w-6 bg-brand-sky" />
            {labels.legendOwns}
          </li>
        </ul>
      </div>

      {/* What the chosen house is connected to */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-[calc(7rem+var(--ticker-h,0px))]">
        <div className="glass relative min-h-[22rem] overflow-hidden rounded-[1.75rem] border border-fg/10 p-6 sm:p-7">
          {/* Time left on this house while the map plays by itself */}
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-fg/[0.06]">
            <span ref={barRef} className="block h-full origin-left bg-gradient-to-r from-brand-sky to-gold" style={{ transform: "scaleX(0)" }} />
          </span>
          {/* Controls: previous, play or pause, next, and where we are */}
          <div className="mb-5 flex items-center gap-2">
            <button type="button" onClick={() => choose(active - 1)} aria-label={labels.prev} className="flex size-9 items-center justify-center rounded-full border border-fg/15 text-text-secondary transition-colors hover:border-brand-sky/60 hover:text-fg">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current stroke-[1.8]"><path d="M10 3 5 8l5 5" /></svg>
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying((p) => !p);
                waitUntil.current = 0;
              }}
              aria-label={playing ? labels.pause : labels.play}
              aria-pressed={!playing}
              className="flex size-9 items-center justify-center rounded-full border border-fg/15 text-text-secondary transition-colors hover:border-brand-sky/60 hover:text-fg"
            >
              {playing ? (
                <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-current"><path d="M4 3h3v10H4zM9 3h3v10H9z" /></svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-current"><path d="M4 2.5v11l9-5.5z" /></svg>
              )}
            </button>
            <button type="button" onClick={() => choose(active + 1)} aria-label={labels.next} className="flex size-9 items-center justify-center rounded-full border border-fg/15 text-text-secondary transition-colors hover:border-brand-sky/60 hover:text-fg">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current stroke-[1.8]"><path d="m6 3 5 5-5 5" /></svg>
            </button>
            <span className="ml-1 whitespace-nowrap font-mono text-xs text-text-secondary tabular-nums">
              {nf(active + 1)} / {nf(n)}
            </span>
            {playing && !reduce && <span className="ml-auto hidden text-right text-xs text-text-secondary sm:inline">{labels.autoHint}</span>}
          </div>
          <div aria-live={playing ? "off" : "polite"}>
          {m ? (
            <div key={m.id} className="cx-panel flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-black/5">
                  {m.logo ? (
                    <Image src={m.logo.url} alt="" width={m.logo.width ?? 160} height={m.logo.height ?? 64} className="h-full w-full object-contain" />
                  ) : (
                    <span className="font-mono text-sm font-semibold text-[#0b1a33]">{monogram(m.name, m.shortName)}</span>
                  )}
                </span>
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="font-display text-xl leading-snug font-semibold text-text-primary">{m.name}</h3>
                  <p className="flex flex-wrap gap-1.5 text-xs font-semibold">
                    <span className="rounded-full bg-brand-sky/10 px-2.5 py-1 text-brand-sky">{labels.shareholder}</span>
                    {m.reps.some((r) => r.group === "BOARD") && <span className="rounded-full bg-gold/15 px-2.5 py-1 text-gold">{labels.boardSeat}</span>}
                  </p>
                </div>
              </div>

              {(m.description || m.dseTrec || m.cseTrec || m.websiteUrl || m.rank) && (
                <div className="flex flex-col gap-3">
                  {m.rank && labels.rank && <RankBadge rank={m.rank} labels={labels.rank} locale={locale} detailed />}
                  {m.description && <p className="text-sm leading-relaxed text-text-primary/90">{m.description}</p>}
                  <p className="flex flex-wrap items-center gap-2 text-xs">
                    {m.dseTrec && (
                      <span className="rounded-lg border border-fg/10 px-2.5 py-1 font-mono text-text-secondary">
                        {labels.dseTrec} <span className="font-semibold text-text-primary">{nf(Number(m.dseTrec)).padStart(m.dseTrec.length, locale === "bn" ? "০" : "0")}</span>
                      </span>
                    )}
                    {m.cseTrec && (
                      <span className="rounded-lg border border-fg/10 px-2.5 py-1 font-mono text-text-secondary">
                        {labels.cseTrec} <span className="font-semibold text-text-primary">{nf(Number(m.cseTrec)).padStart(m.cseTrec.length, locale === "bn" ? "০" : "0")}</span>
                      </span>
                    )}
                    {m.websiteUrl && (
                      <a
                        href={m.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-sky/40 px-2.5 py-1 font-semibold text-brand-sky transition-colors hover:bg-brand-sky/10"
                      >
                        {labels.visitWebsite}: {m.websiteUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </p>
                </div>
              )}

              <section className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-text-secondary">{labels.representedBy}</h4>
                {m.reps.length ? (
                  <ul className="flex flex-col gap-3">
                    {m.reps.map((r) => (
                      <li key={r.name} className="flex flex-wrap items-center gap-3 rounded-2xl border border-fg/10 p-2.5 pr-3 transition-colors hover:border-gold/60 sm:flex-nowrap">
                        {r.group === "REPRESENTATIVE" ? (
                          // Representative only: no seat at Xpert Fintech, so no profile page to link to.
                          <div className="group flex min-w-0 flex-1 items-center gap-3">
                          <span className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-xl bg-navy-800">
                            {r.photo ? (
                              <Image src={r.photo} alt="" fill sizes="3rem" quality={90} className="object-cover object-top" style={r.photoStyle} />
                            ) : (
                              <span className="flex h-full items-center justify-center font-display text-sm text-text-secondary">{monogram(r.name)}</span>
                            )}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="font-semibold text-text-primary group-hover:text-gold">{r.name}</span>
                            <span className="text-xs text-gold">
                              {labels.representative ?? "Representative"}
                            </span>
                            {r.position && <span className="line-clamp-2 text-xs text-text-secondary">{r.position}</span>}
                          </span>
                          </div>
                        ) : (
                          <Link href={r.group === "BOARD" ? labels.boardHref : labels.consultantsHref} className="group flex min-w-0 flex-1 items-center gap-3">
                          <span className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-xl bg-navy-800">
                            {r.photo ? (
                              <Image src={r.photo} alt="" fill sizes="3rem" quality={90} className="object-cover object-top" style={r.photoStyle} />
                            ) : (
                              <span className="flex h-full items-center justify-center font-display text-sm text-text-secondary">{monogram(r.name)}</span>
                            )}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="font-semibold text-text-primary group-hover:text-gold">{r.name}</span>
                            <span className="text-xs text-gold">
                              {(labels.roleAtXpert ?? "{title}").replace("{title}", r.group === "BOARD" ? r.title ?? labels.boardSeat : r.title ?? labels.consultant)}
                            </span>
                            {r.position && <span className="line-clamp-2 text-xs text-text-secondary">{r.position}</span>}
                          </span>
                          </Link>
                        )}
                        {/* LinkedIn, email, and the house's website */}
                        <span className="flex shrink-0 items-center gap-1.5">
                          {labels.contact && (
                            <>
                              <ContactIcon kind="linkedin" value={r.linkedin ?? null} name={r.name} org={m.name} labels={labels.contact} color="var(--color-brand-sky)" ink="var(--color-brand-sky)" size="size-8" />
                              <ContactIcon kind="email" value={r.email ?? null} name={r.name} labels={labels.contact} color="var(--color-brand-sky)" ink="var(--color-brand-sky)" size="size-8" />
                            </>
                          )}
                          {(r.website || m.websiteUrl) && (
                            <a
                              href={(r.website || m.websiteUrl)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${m.name}: ${(r.website || m.websiteUrl)!.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}`}
                              title={(r.website || m.websiteUrl)!.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                              className="contact-icon flex size-8 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-300"
                              style={{ "--c": "var(--color-brand-sky)", "--ci": "var(--color-brand-sky)" } as CSSProperties}
                            >
                              <Icon name="globe" className="size-4" />
                            </a>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  // No representative on file yet: the same card, with a placeholder portrait.
                  <div className="flex items-center gap-3 rounded-2xl border border-dashed border-fg/15 p-2.5 pr-3">
                    <span className="relative flex aspect-[4/5] w-12 shrink-0 items-end justify-center overflow-hidden rounded-xl bg-navy-800">
                      <svg viewBox="0 0 40 50" className="h-full w-full text-fg/20" aria-hidden="true">
                        <circle cx="20" cy="19" r="8" fill="currentColor" />
                        <path d="M5 50c1.5-10 7.5-15 15-15s13.5 5 15 15Z" fill="currentColor" />
                      </svg>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold text-text-secondary">{labels.repPending ?? labels.noRep}</span>
                      <span className="text-xs text-gold">{labels.shareholder}, Xpert Fintech Ltd.</span>
                      <span className="line-clamp-1 text-xs text-text-secondary">{m.name}</span>
                    </span>
                    {m.websiteUrl && (
                      <a
                        href={m.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${m.name}: ${m.websiteUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}`}
                        className="contact-icon flex size-8 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-300"
                        style={{ "--c": "var(--color-brand-sky)", "--ci": "var(--color-brand-sky)" } as CSSProperties}
                      >
                        <Icon name="globe" className="size-4" />
                      </a>
                    )}
                  </div>
                )}
              </section>

              <section className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-text-secondary">{labels.apps}</h4>
                {m.apps.length ? (
                  <ul className="flex flex-col gap-2">
                    {m.apps.map((a) => (
                      <li key={a.name} className="flex flex-wrap items-center gap-2 rounded-2xl border border-fg/10 p-3">
                        <span className="mr-auto font-semibold text-text-primary">{a.name}</span>
                        {[
                          a.playStoreUrl && { href: a.playStoreUrl, label: labels.android },
                          a.appStoreUrl && { href: a.appStoreUrl, label: labels.ios },
                          a.webUrl && { href: a.webUrl, label: labels.web },
                        ]
                          .filter((l): l is { href: string; label: string } => !!l)
                          .map((l) => (
                            <a
                              key={l.href}
                              href={l.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 items-center rounded-full border border-fg/15 px-3 text-xs font-semibold text-brand-sky transition-colors hover:border-brand-sky/60"
                            >
                              {l.label} <span aria-hidden="true" className="ml-1">↗</span>
                            </a>
                          ))}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-secondary">{labels.noApp}</p>
                )}
              </section>

            </div>
          ) : (
            <p className="text-text-secondary">{labels.pickBody}</p>
          )}
          </div>
        </div>
        {/* Every house as a button too: quick on phones, and a plain list for screen readers. */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-text-secondary">{labels.allMembers}</p>
          <ul className="flex flex-wrap gap-1.5">
            {members.map((x, i) => (
              <li key={x.id}>
                <button
                  type="button"
                  aria-pressed={active === i}
                  onClick={() => choose(i)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    active === i ? "border-brand-sky bg-brand-sky/15 text-text-primary" : "border-fg/10 text-text-secondary hover:border-brand-sky/50 hover:text-text-primary",
                  )}
                >
                  {x.shortName ?? x.name.replace(/\s+(Limited|Ltd\.?|PLC|লিমিটেড|পিএলসি)$/i, "")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
