import { MotionPause } from "@/components/motion/MotionPause";
import { Badge } from "@/components/ui/Badge";

/**
 * Hero visual: brokerages connect through one Xpert layer to DSE and CSE.
 * A conceptual picture, always labelled as such — it does not show real
 * network locations or topology. Motion: packets travel along each link;
 * paused off-screen; static under reduced motion.
 */
const W = 520;
const H = 440;
const xpert = { x: 260, y: 220 };
const brokers = [
  { x: 70, y: 70 },
  { x: 70, y: 170 },
  { x: 70, y: 270 },
  { x: 70, y: 370 },
];
const exchanges = [
  { x: 450, y: 150, label: "DSE" },
  { x: 450, y: 290, label: "CSE" },
];

export function MarketNetwork({ caption }: { caption: string }) {
  const links = [
    ...brokers.map((b, i) => ({ id: `b${i}`, d: `M${b.x + 18} ${b.y} C ${b.x + 110} ${b.y}, ${xpert.x - 110} ${xpert.y}, ${xpert.x - 46} ${xpert.y}` })),
    ...exchanges.map((e, i) => ({ id: `e${i}`, d: `M${xpert.x + 46} ${xpert.y} C ${xpert.x + 110} ${xpert.y}, ${e.x - 100} ${e.y}, ${e.x - 30} ${e.y}` })),
  ];
  return (
    <figure className="relative">
      <MotionPause>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Brokerages connect through the Xpert platform to the Dhaka and Chittagong stock exchanges">
          <defs>
            <radialGradient id="mn-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style={{ stopColor: "var(--color-brand-sky)", stopOpacity: 0.35 }} />
              <stop offset="100%" style={{ stopColor: "var(--color-brand-sky)", stopOpacity: 0 }} />
            </radialGradient>
          </defs>

          {links.map((l) => (
            <path key={l.id} d={l.d} fill="none" className="stroke-brand-sky/30" strokeWidth="1.25" />
          ))}

          {/* Order packets travel each link; SMIL keeps them on the curve. */}
          {links.map((l, i) => (
            <circle key={`p-${l.id}`} r="3.5" className="flow-packet-svg fill-cyan-300" opacity={0}>
              {/* Hidden until its motion starts, so it never waits at the corner. */}
              <set attributeName="opacity" to="1" begin={`${i * 0.45}s`} fill="freeze" />
              <animateMotion dur={`${3.2 + (i % 3) * 0.6}s`} begin={`${i * 0.45}s`} repeatCount="indefinite" path={l.d} />
            </circle>
          ))}

          <circle cx={xpert.x} cy={xpert.y} r="110" fill="url(#mn-glow)" />
          <circle cx={xpert.x} cy={xpert.y} r="46" className="flow-node-pulse fill-ink-950 stroke-brand-sky" strokeWidth="2" />
          <text x={xpert.x} y={xpert.y + 6} textAnchor="middle" fontSize="18" fontWeight="600" className="fill-text-primary">
            Xpert
          </text>

          {brokers.map((b, i) => (
            <g key={i}>
              <rect x={b.x - 26} y={b.y - 16} width="52" height="32" rx="6" className="fill-navy-900 stroke-fg/25" strokeWidth="1" />
              <rect x={b.x - 14} y={b.y - 6} width="28" height="3" rx="1.5" className="fill-fg/30" />
              <rect x={b.x - 14} y={b.y + 3} width="18" height="3" rx="1.5" className="fill-fg/20" />
            </g>
          ))}

          {exchanges.map((e) => (
            <g key={e.label}>
              <rect x={e.x - 30} y={e.y - 22} width="60" height="44" rx="8" className="fill-ink-950 stroke-brand-sky/60" strokeWidth="1.25" />
              <text x={e.x} y={e.y + 5} textAnchor="middle" fontSize="15" fontWeight="600" className="tabular fill-text-primary">
                {e.label}
              </text>
            </g>
          ))}
        </svg>
      </MotionPause>
      <figcaption className="absolute right-0 bottom-0">
        <Badge>{caption}</Badge>
      </figcaption>
    </figure>
  );
}
