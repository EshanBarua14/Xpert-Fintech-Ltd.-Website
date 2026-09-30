import type { CSSProperties } from "react";

/* Positions of the falling light streams (percent of viewport width), with timing. */
const STREAMS = [
  { left: 8, delay: 0, dur: 9 },
  { left: 21, delay: 3.5, dur: 11 },
  { left: 34, delay: 6, dur: 8 },
  { left: 49, delay: 1.5, dur: 12 },
  { left: 63, delay: 7.5, dur: 10 },
  { left: 77, delay: 2.5, dur: 9 },
  { left: 91, delay: 5, dur: 11 },
];

/**
 * Site-wide animated backdrop behind all content: drifting light, a slowly
 * moving grid and thin light streams falling along it. Decorative only;
 * CSS transforms and opacity, so it stays smooth, and it stops for
 * visitors who prefer reduced motion.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="ambient">
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />
      <div className="ambient-grid" />
      {STREAMS.map((s) => (
        <span
          key={s.left}
          className="ambient-stream"
          style={{ left: `${s.left}%`, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` } as CSSProperties}
        />
      ))}
    </div>
  );
}
