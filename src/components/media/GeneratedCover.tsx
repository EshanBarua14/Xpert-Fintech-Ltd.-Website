import { cn } from "@/lib/utils/cn";

/*
 * Covers for news and events that have no photo yet: a design drawn from the
 * item's own id, so every story and every event gets a different one, in the
 * brand's colours (market-data motifs: candles, a price line, order-book
 * bars, rings). It is plainly a graphic, never a picture of people or places.
 * A date stamp sits on it, as on a press photo. Fixed colours: a cover looks
 * the same in light and dark mode, like a photo would.
 */

export type Stamp = {
  /** "19" — the day, large. Absent when only the month is known. */
  day?: string | null;
  /** "Aug 2026" or "August 2026". */
  monthYear?: string | null;
  /** "10:30 AM", when the item has a time of day. */
  time?: string | null;
};

/** A small, stable hash of a string (FNV-1a), for picking a design. */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A tiny seeded random generator (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTES = [
  { a: "#0b1c31", b: "#2a5fae", line: "#22bceb", hi: "#67e8f9" },
  { a: "#06111f", b: "#164a7a", line: "#22bceb", hi: "#e0b252" },
  { a: "#0b1c31", b: "#1d3f6e", line: "#67e8f9", hi: "#22bceb" },
  { a: "#081626", b: "#2a5fae", line: "#e0b252", hi: "#22bceb" },
  { a: "#0e2240", b: "#0f6d8f", line: "#67e8f9", hi: "#e0b252" },
];

const W = 640;
const H = 360;

function Motif({ kind, r, p }: { kind: number; r: () => number; p: (typeof PALETTES)[number] }) {
  if (kind === 0) {
    // Candles along a drifting trend.
    const n = 18;
    let y = H * (0.45 + r() * 0.2);
    return (
      <g>
        {Array.from({ length: n }, (_, i) => {
          const x = 40 + (i * (W - 80)) / (n - 1);
          const open = y;
          y = Math.max(70, Math.min(H - 70, y + (r() - 0.52) * 46));
          const close = y;
          const hiY = Math.min(open, close) - 8 - r() * 22;
          const loY = Math.max(open, close) + 8 + r() * 22;
          const up = close < open;
          return (
            <g key={i} opacity={0.35 + (i / n) * 0.55}>
              <line x1={x} x2={x} y1={hiY} y2={loY} stroke={up ? p.line : p.hi} strokeWidth={2} />
              <rect x={x - 7} y={Math.min(open, close)} width={14} height={Math.max(4, Math.abs(close - open))} rx={2} fill={up ? p.line : p.hi} />
            </g>
          );
        })}
      </g>
    );
  }
  if (kind === 1) {
    // A price line with its area, and a grid.
    const pts: [number, number][] = [];
    let y = H * (0.55 + r() * 0.15);
    for (let x = 0; x <= W; x += 16) {
      y = Math.max(60, Math.min(H - 50, y + (r() - 0.55) * 26));
      pts.push([x, y]);
    }
    const d = pts.map(([x, yy], i) => `${i ? "L" : "M"}${x},${yy.toFixed(1)}`).join(" ");
    return (
      <g>
        {Array.from({ length: 6 }, (_, i) => (
          <line key={i} x1={0} x2={W} y1={50 + i * 52} y2={50 + i * 52} stroke="#ffffff" strokeOpacity={0.06} />
        ))}
        <path d={`${d} L${W},${H} L0,${H} Z`} fill={p.line} fillOpacity={0.14} />
        <path d={d} fill="none" stroke={p.line} strokeWidth={3} strokeLinejoin="round" />
        <circle cx={pts[pts.length - 1]![0] - 4} cy={pts[pts.length - 1]![1]} r={6} fill={p.hi} />
      </g>
    );
  }
  if (kind === 2) {
    // Order-book depth bars from both sides.
    const rows = 11;
    return (
      <g>
        {Array.from({ length: rows }, (_, i) => {
          const y = 34 + i * 28;
          const bid = 60 + r() * (W * 0.38);
          const ask = 60 + r() * (W * 0.38);
          return (
            <g key={i}>
              <rect x={W / 2 - bid} y={y} width={bid} height={16} rx={3} fill={p.line} fillOpacity={0.18 + r() * 0.3} />
              <rect x={W / 2} y={y} width={ask} height={16} rx={3} fill={p.hi} fillOpacity={0.14 + r() * 0.26} />
            </g>
          );
        })}
        <line x1={W / 2} x2={W / 2} y1={20} y2={H - 20} stroke="#ffffff" strokeOpacity={0.25} />
      </g>
    );
  }
  // Rings spreading from a point, like a signal.
  const cx = W * (0.55 + r() * 0.35);
  const cy = H * (0.2 + r() * 0.6);
  return (
    <g fill="none">
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={cx} cy={cy} r={30 + i * 42} stroke={i % 3 === 0 ? p.hi : p.line} strokeOpacity={0.5 - i * 0.045} strokeWidth={i % 3 === 0 ? 2.5 : 1.5} />
      ))}
      <circle cx={cx} cy={cy} r={7} fill={p.hi} />
    </g>
  );
}

/**
 * The cover itself. Fills its parent (give the parent a size and
 * `position: relative`). `label` is a short word in the corner (e.g. the
 * category), `stamp` the date stamp.
 */
export function GeneratedCover({ seed, label, stamp, size = "md", className }: { seed: string; label?: string | null; stamp?: Stamp | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const h = hash(seed);
  const r = rng(h);
  const p = PALETTES[hash(`${seed}:palette`) % PALETTES.length]!;
  // Pattern and colours picked independently, so neighbours rarely look alike.
  const kind = hash(`${seed}:motif`) % 4;
  const angle = Math.round(r() * 360);
  const id = `gc-${h.toString(36)}`;
  return (
    <span aria-hidden="true" className={cn("absolute inset-0 block overflow-hidden", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id={`${id}-bg`} gradientTransform={`rotate(${angle} .5 .5)`}>
            <stop offset="0" stopColor={p.a} />
            <stop offset="1" stopColor={p.b} />
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx={0.2 + r() * 0.6} cy={0.2 + r() * 0.5} r="0.7">
            <stop offset="0" stopColor={p.line} stopOpacity="0.28" />
            <stop offset="1" stopColor={p.line} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${id}-bg)`} />
        <rect width={W} height={H} fill={`url(#${id}-glow)`} />
        <Motif kind={kind} r={r} p={p} />
      </svg>
      {stamp && <DateStamp stamp={stamp} size={size} />}
      {label && (
        <span className={cn("absolute top-3 right-3 max-w-[60%] truncate rounded-full bg-[#05080f]/60 px-3 py-1 font-semibold text-white backdrop-blur", size === "sm" ? "text-[max(10px,0.625rem)]" : "text-xs")}>
          {label}
        </span>
      )}
    </span>
  );
}

/** The date stamp in the corner of a cover (generated or a real photo). */
export function DateStamp({ stamp, size = "md", className }: { stamp: Stamp; size?: "sm" | "md" | "lg"; className?: string }) {
  if (!stamp.day && !stamp.monthYear) return null;
  return (
    <span
      className={cn(
        "absolute bottom-3 left-3 flex items-center gap-2.5 rounded-xl bg-[#05080f]/70 text-white shadow-lg ring-1 ring-white/10 backdrop-blur",
        size === "sm" ? "px-2 py-1" : size === "lg" ? "px-4 py-2.5" : "px-3 py-1.5",
        className,
      )}
    >
      {stamp.day && <span className={cn("font-display leading-none font-semibold tabular-nums", size === "sm" ? "text-lg" : size === "lg" ? "text-4xl" : "text-2xl")}>{stamp.day}</span>}
      <span className="flex flex-col leading-tight">
        {stamp.monthYear && <span className={cn("font-semibold", size === "sm" ? "text-[max(10px,0.625rem)]" : "text-xs")}>{stamp.monthYear}</span>}
        {stamp.time && <span className={cn("font-mono text-[#67e8f9]", size === "sm" ? "text-[max(10px,0.625rem)]" : "text-xs")}>{stamp.time}</span>}
      </span>
    </span>
  );
}

/**
 * The stamp for a date in Dhaka time: day, month and year, and the time of
 * day when one was set (not midnight). Only month and year when `approx`.
 */
export function stampFor(date: Date | null | undefined, locale: "en" | "bn", opts: { approx?: boolean; withTime?: boolean } = {}): Stamp | null {
  if (!date) return null;
  const tag = locale === "bn" ? "bn-BD" : "en-GB";
  const tz = "Asia/Dhaka";
  const monthYear = new Intl.DateTimeFormat(tag, { month: "short", year: "numeric", timeZone: tz }).format(date);
  if (opts.approx) return { monthYear: new Intl.DateTimeFormat(tag, { month: "long", year: "numeric", timeZone: tz }).format(date) };
  const day = new Intl.DateTimeFormat(tag, { day: "numeric", timeZone: tz }).format(date);
  let time: string | null = null;
  if (opts.withTime !== false) {
    const hm = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz }).format(date);
    // A date saved without a time is midnight in Dhaka or in UTC (6:00 AM here): no time then.
    const utcMidnight = date.getUTCHours() === 0 && date.getUTCMinutes() === 0;
    if (hm !== "00:00" && !utcMidnight) time = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(date);
  }
  return { day, monthYear, time };
}
