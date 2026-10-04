"use client";

import { useEffect, useRef } from "react";

/**
 * Faint, decorative page backdrops that match what a page is about. Each
 * scene draws on one full-screen canvas behind the content: no figures, no
 * text that could be read as data. ~30 fps (15 on phones), paused when the tab
 * is hidden, one still frame for visitors who prefer reduced motion.
 *
 *  - network: consortium nodes joined by links, with pulses travelling along them
 *  - people:  a slow constellation of points that link up when they pass close
 *  - wire:    a newsroom wire — rows of headline-like bars sliding across
 *  - bokeh:   soft out-of-focus light, like a photograph's background
 *  - signal:  rings radiating from a point, as from an office on a map
 */
export type SceneName = "network" | "people" | "wire" | "bokeh" | "signal";

type Ctx = CanvasRenderingContext2D;
type Scene = { draw: (ctx: Ctx, now: number, dt: number, light: boolean, still: boolean) => void };
type Rand = () => number;

// Brand light blue, as rgb strings for each theme.
const C = (light: boolean) => (light ? "10,120,173" : "56,189,248");
const GOLD = (light: boolean) => (light ? "138,93,11" : "224,178,82");

function network(w: number, h: number, rand: Rand): Scene {
  const count = w < 640 ? 14 : 26;
  const nodes = Array.from({ length: count }, () => ({ x: rand() * w, y: rand() * h, vx: (rand() - 0.5) * 6, vy: (rand() - 0.5) * 6, r: 1.5 + rand() * 2.5 }));
  const edges: [number, number][] = [];
  nodes.forEach((a, i) => {
    const near = nodes
      .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter((n) => n.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);
    for (const n of near) if (!edges.some(([p, q]) => (p === i && q === n.j) || (p === n.j && q === i))) edges.push([i, n.j]);
  });
  const pulses: { e: number; t: number; speed: number }[] = [];
  let lastPulse = 0;
  return {
    draw(ctx, now, dt, light, still) {
      const c = C(light);
      for (const n of nodes) {
        if (still) break;
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < -20 || n.x > w + 20) n.vx *= -1;
        if (n.y < -20 || n.y > h + 20) n.vy *= -1;
      }
      ctx.lineWidth = 1;
      for (const [i, j] of edges) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        ctx.strokeStyle = `rgba(${c},${light ? 0.1 : 0.09})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (const n of nodes) {
        ctx.fillStyle = `rgba(${c},${light ? 0.22 : 0.25})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${c},0.08)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (!still && now - lastPulse > 420 && edges.length) {
        lastPulse = now;
        pulses.push({ e: Math.floor(rand() * edges.length), t: 0, speed: 0.35 + rand() * 0.4 });
      }
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k]!;
        p.t += p.speed * dt;
        if (p.t >= 1) {
          pulses.splice(k, 1);
          continue;
        }
        const [i, j] = edges[p.e]!;
        const a = nodes[i]!;
        const b = nodes[j]!;
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
        g.addColorStop(0, `rgba(${GOLD(light)},${light ? 0.55 : 0.6})`);
        g.addColorStop(1, `rgba(${GOLD(light)},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}

function people(w: number, h: number, rand: Rand): Scene {
  const count = w < 640 ? 40 : 90;
  const pts = Array.from({ length: count }, () => ({ x: rand() * w, y: rand() * h, vx: (rand() - 0.5) * 8, vy: (rand() - 0.5) * 8, r: 0.8 + rand() * 1.6, tw: rand() * Math.PI * 2 }));
  const LINK = w < 640 ? 90 : 120;
  return {
    draw(ctx, now, dt, light, still) {
      const c = C(light);
      for (const p of pts) {
        if (!still) {
          p.x = (p.x + p.vx * dt + w) % w;
          p.y = (p.y + p.vy * dt + h) % h;
        }
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i]!;
          const b = pts[j]!;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > LINK) continue;
          ctx.strokeStyle = `rgba(${c},${((1 - d / LINK) * (light ? 0.1 : 0.12)).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      for (const p of pts) {
        const twinkle = 0.18 + 0.12 * Math.sin(now / 900 + p.tw);
        ctx.fillStyle = `rgba(${c},${(light ? twinkle * 0.9 : twinkle).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}

function wire(w: number, h: number, rand: Rand): Scene {
  const ROW = 44;
  const rows = Array.from({ length: Math.ceil(h / ROW) + 1 }, (_, i) => {
    const bars: { x: number; len: number; hot: boolean }[] = [];
    for (let x = rand() * -200; x < w + 400; ) {
      const len = 40 + rand() * 180;
      bars.push({ x, len, hot: rand() < 0.06 });
      x += len + 24 + rand() * 60;
    }
    return { y: i * ROW + 18, speed: (i % 2 ? -1 : 1) * (6 + rand() * 10), bars, dot: rand() < 0.5 };
  });
  return {
    draw(ctx, _now, dt, light, still) {
      const c = C(light);
      for (const r of rows) {
        // Faint rule under each row, like column lines on a wire printout.
        ctx.fillStyle = `rgba(${c},0.035)`;
        ctx.fillRect(0, r.y + 10, w, 1);
        for (const b of r.bars) {
          if (!still) b.x += r.speed * dt;
          const span = w + 600;
          if (b.x > w + 200) b.x -= span;
          if (b.x + b.len < -400) b.x += span;
          ctx.fillStyle = b.hot ? `rgba(${GOLD(light)},${light ? 0.22 : 0.2})` : `rgba(${c},${light ? 0.07 : 0.06})`;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(b.x, r.y - 3, b.len, 6, 3);
          else ctx.rect(b.x, r.y - 3, b.len, 6);
          ctx.fill();
        }
      }
    },
  };
}

function bokeh(w: number, h: number, rand: Rand): Scene {
  const count = w < 640 ? 10 : 18;
  const palette = ["56,189,248", "37,99,235", "224,178,82", "167,139,250"];
  const orbs = Array.from({ length: count }, () => ({
    x: rand() * w,
    y: rand() * h,
    r: 30 + rand() * (w < 640 ? 70 : 140),
    vx: (rand() - 0.5) * 10,
    vy: -4 - rand() * 8,
    col: palette[Math.floor(rand() * palette.length)]!,
    a: 0.05 + rand() * 0.07,
  }));
  return {
    draw(ctx, now, dt, light, still) {
      for (const o of orbs) {
        if (!still) {
          o.x += o.vx * dt;
          o.y += o.vy * dt;
          if (o.y < -o.r) o.y = h + o.r;
          if (o.x < -o.r) o.x = w + o.r;
          if (o.x > w + o.r) o.x = -o.r;
        }
        const a = (light ? o.a * 0.8 : o.a) * (0.85 + 0.15 * Math.sin(now / 1500 + o.r));
        const g = ctx.createRadialGradient(o.x, o.y, o.r * 0.2, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${o.col},${a.toFixed(3)})`);
        g.addColorStop(0.75, `rgba(${o.col},${(a * 0.6).toFixed(3)})`);
        g.addColorStop(1, `rgba(${o.col},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
        // A thin rim, like an out-of-focus highlight.
        ctx.strokeStyle = `rgba(${o.col},${(a * 0.9).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },
  };
}

function signal(w: number, h: number, rand: Rand): Scene {
  const cx = w * (w < 768 ? 0.7 : 0.78);
  const cy = h * 0.42;
  const dots: { x: number; y: number }[] = [];
  // A faint dot grid, like a map.
  for (let x = 12; x < w; x += 26) for (let y = 12; y < h; y += 26) if (rand() < 0.55) dots.push({ x, y });
  return {
    draw(ctx, now, _dt, light, still) {
      const c = C(light);
      ctx.fillStyle = `rgba(${c},${light ? 0.08 : 0.07})`;
      for (const d of dots) ctx.fillRect(d.x, d.y, 1.5, 1.5);
      const max = Math.hypot(w, h) * 0.55;
      const t = still ? 0.35 : (now / 5200) % 1;
      for (let k = 0; k < 4; k++) {
        const p = (t + k / 4) % 1;
        const r = 20 + p * max;
        ctx.strokeStyle = `rgba(${c},${((1 - p) * (light ? 0.16 : 0.18)).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
      g.addColorStop(0, `rgba(${GOLD(light)},0.55)`);
      g.addColorStop(1, `rgba(${GOLD(light)},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();
    },
  };
}

const SCENES: Record<SceneName, (w: number, h: number, rand: Rand) => Scene> = { network, people, wire, bokeh, signal };

export function SceneCanvas({ scene }: { scene: SceneName }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let w = 0;
    let h = 0;
    let current: Scene;
    const build = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      seed = 7;
      current = SCENES[scene](w, h, rand);
    };
    build();

    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      current.draw(ctx, now, dt, document.documentElement.dataset.theme === "light", reduce);
    };
    let raf = 0;
    let prev = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - prev < (w < 768 ? 66 : 33)) return;
      prev = now;
      draw(now);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (reduce) draw(performance.now());
      else {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    start();
    const onResize = () => {
      build();
      if (reduce) draw(performance.now());
    };
    const onVisibility = () => (document.hidden ? cancelAnimationFrame(raf) : start());
    const onTheme = new MutationObserver(() => reduce && draw(performance.now()));
    onTheme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      onTheme.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [scene]);

  return <canvas ref={ref} aria-hidden="true" className="bourse-canvas" />;
}
