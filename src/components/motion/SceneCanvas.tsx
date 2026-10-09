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
 *  - ledger:  back office — ledger rows rising in columns, entries ticked off in gold
 *  - docs:    DMS — document sheets drifting up, filed with a gold check
 *  - identity: eKYC and account opening — ID cards scanned by a passing light, then verified
 */
export type SceneName = "network" | "people" | "wire" | "bokeh" | "signal" | "ledger" | "docs" | "identity";

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
  void rand;
  return {
    draw(ctx, now, _dt, light, still) {
      const c = C(light);
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

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function tick(ctx: Ctx, x: number, y: number, size: number, rgba: string) {
  ctx.strokeStyle = rgba;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.5, y);
  ctx.lineTo(x - size * 0.1, y + size * 0.4);
  ctx.lineTo(x + size * 0.6, y - size * 0.45);
  ctx.stroke();
}

function ledger(w: number, h: number, rand: Rand): Scene {
  const ROW = 30;
  const cols = w < 640 ? [0.08, 0.5] : [0.06, 0.3, 0.55, 0.78];
  const rows = Array.from({ length: Math.ceil(h / ROW) + 2 }, (_, i) => ({ y: i * ROW, cells: cols.map(() => 40 + rand() * 90), done: rand() < 0.25, at: rand() * 8000 }));
  let offset = 0;
  return {
    draw(ctx, now, dt, light, still) {
      const c = C(light);
      if (!still) offset = (offset + dt * 9) % ROW;
      for (const r of rows) {
        const y = r.y - offset;
        cols.forEach((cx, k) => {
          const x = cx * w;
          ctx.fillStyle = `rgba(${c},${light ? 0.07 : 0.06})`;
          rr(ctx, x, y, r.cells[k]!, 5, 2.5);
          ctx.fill();
          // Amounts right-aligned in the next column, like debit and credit.
          ctx.fillRect(x + r.cells[k]! + 24, y, 26, 5);
        });
        const lit = !still && (now + r.at) % 9000 < 1600;
        if (r.done || lit) tick(ctx, w * (w < 640 ? 0.94 : 0.97), y + 2, 9, `rgba(${GOLD(light)},${lit ? 0.4 : 0.14})`);
      }
    },
  };
}

function docs(w: number, h: number, rand: Rand): Scene {
  const count = w < 640 ? 7 : 14;
  const sheets = Array.from({ length: count }, () => ({
    x: rand() * w,
    y: rand() * h,
    s: 0.7 + rand() * 0.7,
    vy: -6 - rand() * 8,
    rot: (rand() - 0.5) * 0.3,
    at: rand() * 10000,
  }));
  return {
    draw(ctx, now, dt, light, still) {
      const c = C(light);
      for (const d of sheets) {
        if (!still) {
          d.y += d.vy * dt;
          if (d.y < -120) d.y = h + 60;
        }
        const W = 54 * d.s;
        const H = 70 * d.s;
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);
        ctx.strokeStyle = `rgba(${c},${light ? 0.16 : 0.13})`;
        ctx.lineWidth = 1.2;
        // Sheet with a folded corner.
        ctx.beginPath();
        ctx.moveTo(-W / 2, -H / 2);
        ctx.lineTo(W / 2 - 12 * d.s, -H / 2);
        ctx.lineTo(W / 2, -H / 2 + 12 * d.s);
        ctx.lineTo(W / 2, H / 2);
        ctx.lineTo(-W / 2, H / 2);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = `rgba(${c},${light ? 0.08 : 0.07})`;
        for (let i = 0; i < 4; i++) ctx.fillRect(-W / 2 + 8 * d.s, -H / 2 + (16 + i * 11) * d.s, (i === 3 ? 0.45 : 0.75) * W, 3 * d.s);
        const filed = !still && (now + d.at) % 11000 < 1800;
        if (filed) tick(ctx, W / 2 - 10 * d.s, H / 2 - 12 * d.s, 10 * d.s, `rgba(${GOLD(light)},0.45)`);
        ctx.restore();
      }
    },
  };
}

function identity(w: number, h: number, rand: Rand): Scene {
  const count = w < 640 ? 4 : 8;
  const cards = Array.from({ length: count }, (_, i) => ({
    x: ((i * 0.618 + 0.1) % 1) * (w - 160) + 20,
    y: ((i * 0.382 + 0.15) % 1) * (h - 110) + 20,
    vy: -3 - rand() * 4,
    at: rand() * 7000,
  }));
  return {
    draw(ctx, now, dt, light, still) {
      const c = C(light);
      for (const k of cards) {
        if (!still) {
          k.y += k.vy * dt;
          if (k.y < -110) k.y = h + 20;
        }
        const W = 150;
        const H = 92;
        ctx.strokeStyle = `rgba(${c},${light ? 0.15 : 0.12})`;
        ctx.lineWidth = 1.2;
        rr(ctx, k.x, k.y, W, H, 10);
        ctx.stroke();
        // Portrait and text lines.
        ctx.beginPath();
        ctx.arc(k.x + 32, k.y + 38, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(k.x + 32, k.y + 74, 20, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.fillStyle = `rgba(${c},${light ? 0.08 : 0.07})`;
        for (let i = 0; i < 3; i++) ctx.fillRect(k.x + 62, k.y + 26 + i * 14, i === 2 ? 44 : 70, 4);
        // A light passes across the card, then it is verified.
        const t = still ? -1 : ((now + k.at) % 7000) / 7000;
        if (t >= 0 && t < 0.4) {
          const sx = k.x + (t / 0.4) * W;
          const g = ctx.createLinearGradient(sx - 18, 0, sx + 2, 0);
          g.addColorStop(0, `rgba(${c},0)`);
          g.addColorStop(1, `rgba(${c},${light ? 0.35 : 0.4})`);
          ctx.fillStyle = g;
          ctx.fillRect(Math.max(k.x, sx - 18), k.y + 3, Math.min(20, sx - k.x), H - 6);
        } else if (t >= 0.4 && t < 0.6) {
          tick(ctx, k.x + W - 20, k.y + H - 22, 12, `rgba(${GOLD(light)},0.5)`);
        }
      }
    },
  };
}

const SCENES: Record<SceneName, (w: number, h: number, rand: Rand) => Scene> = { network, people, wire, bokeh, signal, ledger, docs, identity };

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
