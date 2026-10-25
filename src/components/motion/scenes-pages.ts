/**
 * Page backdrops, one per kind of page, each drawn from what the page is
 * about. Faint and decorative: no readable text and no figures that could be
 * taken for data. Used by SceneCanvas (same frame rate, pause and reduced-motion rules).
 *
 *  - pipeline:  platform — an order's path through stations, held at a check, then on
 *  - modules:   products — a grid of product tiles that light up and join
 *  - journey:   about — a path climbing left to right, milestones lit along it
 *  - table:     board — seats around one table, each linked to the centre
 *  - orgchart:  management — a tree of roles, a pulse running down the branches
 *  - orbit:     consultants — outside expertise circling a core
 *  - code:      careers — lines of code typing in, a cursor blinking
 *  - spotlight: events — a calendar grid, days lit by passing spotlights
 *  - growth:    success stories — columns rising with a trend line over them
 *  - screens:   request a demo — product screens assembling, a cursor clicking
 *  - radar:     search — a sweep finding points
 *  - gate:      RMS — orders arriving at a gate; most pass, some are turned back
 */
export type PageScene = "pipeline" | "modules" | "journey" | "table" | "orgchart" | "orbit" | "code" | "spotlight" | "growth" | "screens" | "radar" | "gate";

type Ctx = CanvasRenderingContext2D;
export type Scene = { draw: (ctx: Ctx, now: number, dt: number, light: boolean, still: boolean) => void };
type Rand = () => number;

const C = (light: boolean) => (light ? "10,120,173" : "56,189,248");
const GOLD = (light: boolean) => (light ? "138,93,11" : "224,178,82");
const a = (light: boolean, dark: number, lightAlpha = dark * 0.85) => (light ? lightAlpha : dark).toFixed(3);

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function glow(ctx: Ctx, x: number, y: number, r: number, rgb: string, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function tick(ctx: Ctx, x: number, y: number, s: number, rgba: string) {
  ctx.strokeStyle = rgba;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.5, y);
  ctx.lineTo(x - s * 0.1, y + s * 0.4);
  ctx.lineTo(x + s * 0.55, y - s * 0.4);
  ctx.stroke();
}

/* Platform: lanes of stations; packets travel along, pause at the check (gold) and go on. */
function pipeline(w: number, h: number, rand: Rand): Scene {
  const lanes = w < 640 ? 3 : 5;
  const stations = 6;
  const gate = 3;
  const ys = Array.from({ length: lanes }, (_, i) => h * (0.18 + (0.64 * i) / Math.max(1, lanes - 1)));
  const xs = Array.from({ length: stations }, (_, i) => w * (0.08 + (0.84 * i) / (stations - 1)));
  const packets: { lane: number; x: number; hold: number; checked: boolean }[] = [];
  let last = 0;
  return {
    draw(ctx, now, dt, light, still) {
      const c = C(light);
      ctx.lineWidth = 1;
      for (const y of ys) {
        ctx.strokeStyle = `rgba(${c},${a(light, 0.07)})`;
        ctx.beginPath();
        ctx.moveTo(xs[0]!, y);
        ctx.lineTo(xs[stations - 1]!, y);
        ctx.stroke();
        xs.forEach((x, i) => {
          ctx.strokeStyle = i === gate ? `rgba(${GOLD(light)},${a(light, 0.22)})` : `rgba(${c},${a(light, 0.14)})`;
          rr(ctx, x - 9, y - 9, 18, 18, 5);
          ctx.stroke();
        });
      }
      if (still) return;
      if (now - last > 520) {
        last = now;
        packets.push({ lane: Math.floor(rand() * lanes), x: xs[0]!, hold: 0, checked: false });
      }
      for (let k = packets.length - 1; k >= 0; k--) {
        const p = packets[k]!;
        const gx = xs[gate]!;
        if (!p.checked && p.x >= gx) {
          p.hold += dt;
          if (p.hold > 0.6) p.checked = true;
        } else p.x += (w < 640 ? 60 : 110) * dt;
        if (p.x > xs[stations - 1]! + 10) {
          packets.splice(k, 1);
          continue;
        }
        const y = ys[p.lane]!;
        if (!p.checked && p.x >= gx) glow(ctx, gx, y, 22, GOLD(light), light ? 0.35 : 0.4);
        glow(ctx, p.x, y, 9, p.checked ? GOLD(light) : c, light ? 0.45 : 0.55);
        if (p.checked && p.x - gx < 40) tick(ctx, gx, y - 22, 10, `rgba(${GOLD(light)},${a(light, 0.5)})`);
      }
    },
  };
}

/* Products: a grid of rounded tiles; a few light up and join to a neighbour. */
function modules(w: number, h: number, rand: Rand): Scene {
  const size = w < 640 ? 54 : 76;
  const gap = size * 0.45;
  const cols = Math.ceil(w / (size + gap)) + 1;
  const rows = Math.ceil(h / (size + gap)) + 1;
  const ox = (w - cols * (size + gap)) / 2;
  const oy = (h - rows * (size + gap)) / 2;
  const lit = new Map<number, number>(); // tile → start time
  let last = 0;
  const pos = (i: number) => ({ x: ox + (i % cols) * (size + gap), y: oy + Math.floor(i / cols) * (size + gap) });
  return {
    draw(ctx, now, _dt, light, still) {
      const c = C(light);
      ctx.lineWidth = 1;
      for (let i = 0; i < cols * rows; i++) {
        const { x, y } = pos(i);
        ctx.strokeStyle = `rgba(${c},${a(light, 0.06)})`;
        rr(ctx, x, y, size, size, 14);
        ctx.stroke();
      }
      if (!still && now - last > 700) {
        last = now;
        lit.set(Math.floor(rand() * cols * rows), now);
      }
      for (const [i, t0] of lit) {
        const k = (now - t0) / 2600;
        if (k > 1) {
          lit.delete(i);
          continue;
        }
        const v = Math.sin(Math.PI * k);
        const { x, y } = pos(i);
        ctx.fillStyle = `rgba(${c},${(v * (light ? 0.07 : 0.08)).toFixed(3)})`;
        rr(ctx, x, y, size, size, 14);
        ctx.fill();
        ctx.strokeStyle = `rgba(${c},${(v * 0.3).toFixed(3)})`;
        ctx.stroke();
        // Joined to the tile on its right.
        if (i % cols < cols - 1) {
          ctx.strokeStyle = `rgba(${GOLD(light)},${(v * 0.35).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(x + size, y + size / 2);
          ctx.lineTo(x + size + gap, y + size / 2);
          ctx.stroke();
        }
      }
    },
  };
}

/* About: a path climbing from lower left to upper right, milestones lighting along it. */
function journey(w: number, h: number, rand: Rand): Scene {
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => ({ x: w * (0.04 + (0.92 * i) / (n - 1)), y: h * (0.85 - 0.6 * (i / (n - 1))) + (rand() - 0.5) * h * 0.12 }));
  return {
    draw(ctx, now, _dt, light, still) {
      const c = C(light);
      const k = still ? 1 : ((now / 9000) % 1.15) / 1;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(${c},${a(light, 0.08)})`;
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      // The lit part of the path.
      const reach = Math.min(1, k) * (n - 1);
      ctx.strokeStyle = `rgba(${c},${a(light, 0.28)})`;
      ctx.beginPath();
      ctx.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i <= Math.ceil(reach) && i < n; i++) {
        const f = Math.min(1, reach - (i - 1));
        const p0 = pts[i - 1]!;
        const p1 = pts[i]!;
        ctx.lineTo(p0.x + (p1.x - p0.x) * f, p0.y + (p1.y - p0.y) * f);
      }
      ctx.stroke();
      pts.forEach((p, i) => {
        const on = i <= reach;
        ctx.fillStyle = on ? `rgba(${GOLD(light)},${a(light, 0.45)})` : `rgba(${c},${a(light, 0.15)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, on ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
        if (on && reach - i < 0.6) glow(ctx, p.x, p.y, 26, GOLD(light), 0.3);
      });
    },
  };
}

/* Board: seats around one table, each linked to the centre; one seat speaks at a time. */
function table(w: number, h: number): Scene {
  const cx = w * 0.72;
  const cy = h * 0.5;
  const R = Math.min(w, h) * (w < 640 ? 0.32 : 0.3);
  const seats = 10;
  return {
    draw(ctx, now, _dt, light, still) {
      const c = C(light);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${c},${a(light, 0.09)})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 0.55, R * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      const speaking = still ? -1 : Math.floor(now / 1800) % seats;
      for (let i = 0; i < seats; i++) {
        const ang = (i / seats) * Math.PI * 2 - Math.PI / 2 + (still ? 0 : now / 90000);
        const x = cx + Math.cos(ang) * R;
        const y = cy + Math.sin(ang) * R;
        const on = i === speaking;
        ctx.strokeStyle = on ? `rgba(${GOLD(light)},${a(light, 0.35)})` : `rgba(${c},${a(light, 0.07)})`;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * R * 0.55, cy + Math.sin(ang) * R * 0.55);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = on ? `rgba(${GOLD(light)},${a(light, 0.5)})` : `rgba(${c},${a(light, 0.2)})`;
        ctx.beginPath();
        ctx.arc(x, y, on ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();
        if (on) glow(ctx, x, y, 30, GOLD(light), 0.3);
      }
      glow(ctx, cx, cy, R * 0.5, c, light ? 0.06 : 0.07);
    },
  };
}

/* Management: a tree of roles; a pulse runs from the top down each branch. */
function orgchart(w: number, h: number): Scene {
  const levels = [1, 3, 7];
  const nodes: { x: number; y: number; parent: number }[] = [];
  // Boxes never overlap: as wide as the bottom row's spacing allows.
  const bw = Math.min(52, ((w * 0.4) / levels[levels.length - 1]!) * 0.8);
  let start = 0;
  levels.forEach((count, L) => {
    for (let i = 0; i < count; i++) {
      const x = w * (0.55 + 0.4 * ((i + 0.5) / count) - 0.2);
      const y = h * (0.2 + 0.3 * L);
      const parent = L === 0 ? -1 : start - levels[L - 1]! + Math.floor((i / count) * levels[L - 1]!);
      nodes.push({ x, y, parent });
    }
    start += count;
  });
  return {
    draw(ctx, now, _dt, light, still) {
      const c = C(light);
      ctx.lineWidth = 1;
      const k = still ? -1 : (now / 2600) % 1;
      for (const n of nodes) {
        if (n.parent < 0) continue;
        const p = nodes[n.parent]!;
        const midY = (p.y + n.y) / 2;
        ctx.strokeStyle = `rgba(${c},${a(light, 0.09)})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 10);
        ctx.lineTo(p.x, midY);
        ctx.lineTo(n.x, midY);
        ctx.lineTo(n.x, n.y - 10);
        ctx.stroke();
        if (k >= 0) {
          const lvl = p.parent < 0 ? 0 : 1;
          const f = k * 2 - lvl;
          if (f > 0 && f < 1) {
            const pts = [
              [p.x, p.y + 10],
              [p.x, midY],
              [n.x, midY],
              [n.x, n.y - 10],
            ] as const;
            const seg = Math.min(2, Math.floor(f * 3));
            const g = f * 3 - seg;
            const [x0, y0] = pts[seg]!;
            const [x1, y1] = pts[seg + 1]!;
            glow(ctx, x0 + (x1 - x0) * g, y0 + (y1 - y0) * g, 10, GOLD(light), 0.55);
          }
        }
      }
      for (const n of nodes) {
        ctx.strokeStyle = `rgba(${c},${a(light, 0.18)})`;
        rr(ctx, n.x - bw / 2, n.y - 10, bw, 20, 6);
        ctx.stroke();
      }
    },
  };
}

/* Consultants: satellites on orbits around a core. */
function orbit(w: number, h: number, rand: Rand): Scene {
  const cx = w * 0.7;
  const cy = h * 0.5;
  const base = Math.min(w, h) * 0.14;
  const rings = [1.2, 2, 2.9].map((m) => base * m);
  const sats = rings.flatMap((r, i) => Array.from({ length: 2 + i }, () => ({ r, ang: rand() * Math.PI * 2, speed: (0.12 / (i + 1)) * (rand() > 0.5 ? 1 : -1) })));
  return {
    draw(ctx, _now, dt, light, still) {
      const c = C(light);
      ctx.lineWidth = 1;
      for (const r of rings) {
        ctx.strokeStyle = `rgba(${c},${a(light, 0.07)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      glow(ctx, cx, cy, base * 0.9, c, light ? 0.12 : 0.14);
      for (const s of sats) {
        if (!still) s.ang += s.speed * dt;
        const x = cx + Math.cos(s.ang) * s.r;
        const y = cy + Math.sin(s.ang) * s.r;
        ctx.strokeStyle = `rgba(${GOLD(light)},${a(light, 0.12)})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = `rgba(${GOLD(light)},${a(light, 0.45)})`;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}

/* Careers: lines of code (bars, no readable text) typing in, with a blinking cursor. */
function code(w: number, h: number, rand: Rand): Scene {
  const lh = w < 640 ? 20 : 24;
  const x0 = w * (w < 640 ? 0.06 : 0.52);
  const rows = Math.floor((h * 0.8) / lh);
  const lines = Array.from({ length: rows }, () => ({ indent: Math.floor(rand() * 4), words: Array.from({ length: 2 + Math.floor(rand() * 4) }, () => 18 + rand() * 60), gold: rand() < 0.18 }));
  return {
    draw(ctx, now, _dt, light, still) {
      const c = C(light);
      const total = rows + 4;
      const k = still ? rows : (now / 450) % total;
      const y0 = h * 0.1;
      for (let i = 0; i < rows; i++) {
        const ln = lines[i]!;
        const typed = i < Math.floor(k) ? 1 : i === Math.floor(k) ? k % 1 : 0;
        if (!typed) continue;
        let x = x0 + ln.indent * 22;
        const y = y0 + i * lh;
        const width = ln.words.reduce((s, v) => s + v + 8, 0) * typed;
        let used = 0;
        for (const wd of ln.words) {
          if (used >= width) break;
          const len = Math.min(wd, width - used);
          ctx.fillStyle = ln.gold && used === 0 ? `rgba(${GOLD(light)},${a(light, 0.22)})` : `rgba(${c},${a(light, 0.13)})`;
          rr(ctx, x, y, len, 6, 3);
          ctx.fill();
          x += wd + 8;
          used += wd + 8;
        }
        if (i === Math.floor(k) && Math.floor(now / 500) % 2 === 0) {
          ctx.fillStyle = `rgba(${c},${a(light, 0.5)})`;
          ctx.fillRect(x0 + ln.indent * 22 + width + 2, y - 4, 2, 14);
        }
      }
      ctx.strokeStyle = `rgba(${c},${a(light, 0.05)})`;
      ctx.beginPath();
      ctx.moveTo(x0 - 18, y0 - 10);
      ctx.lineTo(x0 - 18, y0 + rows * lh);
      ctx.stroke();
    },
  };
}

/* Events: a calendar grid of days; soft spotlights drift over it and light the days they cross. */
function spotlight(w: number, h: number, rand: Rand): Scene {
  const cell = w < 640 ? 34 : 46;
  const cols = 7;
  const rows = 6;
  const gx = w - cols * cell - w * 0.06;
  const gy = (h - rows * cell) / 2;
  const lights = Array.from({ length: 2 }, () => ({ x: gx + rand() * cols * cell, y: gy + rand() * rows * cell, vx: (rand() - 0.5) * 40, vy: (rand() - 0.5) * 30 }));
  return {
    draw(ctx, now, dt, light, still) {
      const c = C(light);
      for (const L of lights) {
        if (still) break;
        L.x += L.vx * dt;
        L.y += L.vy * dt;
        if (L.x < gx || L.x > gx + cols * cell) L.vx *= -1;
        if (L.y < gy || L.y > gy + rows * cell) L.vy *= -1;
      }
      for (const L of lights) glow(ctx, L.x, L.y, cell * 2.2, c, light ? 0.08 : 0.1);
      const marked = still ? -1 : Math.floor(now / 2200) % (cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let q = 0; q < cols; q++) {
          const x = gx + q * cell + cell / 2;
          const y = gy + r * cell + cell / 2;
          const near = Math.min(...lights.map((L) => Math.hypot(L.x - x, L.y - y))) / (cell * 2.2);
          const v = Math.max(0, 1 - near);
          const idx = r * cols + q;
          ctx.fillStyle = idx === marked ? `rgba(${GOLD(light)},${a(light, 0.5)})` : `rgba(${c},${(0.07 + v * 0.25).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, idx === marked ? 4.5 : 2.5, 0, Math.PI * 2);
          ctx.fill();
          if (idx === marked) glow(ctx, x, y, cell * 0.7, GOLD(light), 0.25);
        }
      }
    },
  };
}

/* Success stories: columns rising one after another, with a trend line over their tops. */
function growth(w: number, h: number, rand: Rand): Scene {
  const n = w < 640 ? 7 : 12;
  const x0 = w * 0.05;
  const span = w * 0.9;
  const bw = (span / n) * 0.42;
  const vals = Array.from({ length: n }, (_, i) => 0.18 + (0.7 * i) / (n - 1) + (rand() - 0.5) * 0.08);
  return {
    draw(ctx, now, _dt, light, still) {
      const c = C(light);
      const cycle = 11000;
      const t = still ? 1 : Math.min(1, ((now % cycle) / cycle) * 1.4);
      const base = h * 0.92;
      const tops: [number, number][] = [];
      vals.forEach((v, i) => {
        const f = Math.max(0, Math.min(1, t * n - i * 0.8));
        const e = 1 - Math.pow(1 - f, 3);
        const x = x0 + (span / n) * (i + 0.5) - bw / 2;
        const bh = v * h * 0.55 * e;
        const g = ctx.createLinearGradient(0, base - bh, 0, base);
        g.addColorStop(0, `rgba(${c},${a(light, 0.12)})`);
        g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g;
        rr(ctx, x, base - bh, bw, Math.max(1, bh), 4);
        ctx.fill();
        if (e > 0.05) tops.push([x + bw / 2, base - bh]);
      });
      if (tops.length > 1) {
        ctx.strokeStyle = `rgba(${GOLD(light)},${a(light, 0.3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        tops.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
        const [lx, ly] = tops[tops.length - 1]!;
        glow(ctx, lx, ly, 16, GOLD(light), 0.45);
      }
    },
  };
}

/* Request a demo: product screens (window frames) assembling; a cursor clicks with a ripple. */
function screens(w: number, h: number, rand: Rand): Scene {
  const frames = Array.from({ length: w < 640 ? 3 : 5 }, (_, i) => ({
    x: w * (0.45 + rand() * 0.45),
    y: h * (0.12 + (0.7 * i) / 5) + rand() * 30,
    w: w < 640 ? 150 : 220 + rand() * 80,
    h: w < 640 ? 90 : 130 + rand() * 40,
    phase: rand() * Math.PI * 2,
  }));
  return {
    draw(ctx, now, _dt, light, still) {
      const c = C(light);
      ctx.lineWidth = 1;
      frames.forEach((f, i) => {
        const dy = still ? 0 : Math.sin(now / 3000 + f.phase) * 6;
        const x = Math.min(f.x, w - f.w - 10);
        const y = f.y + dy;
        ctx.fillStyle = `rgba(${c},${a(light, 0.03)})`;
        rr(ctx, x, y, f.w, f.h, 10);
        ctx.fill();
        ctx.strokeStyle = `rgba(${c},${a(light, 0.14)})`;
        ctx.stroke();
        ctx.strokeStyle = `rgba(${c},${a(light, 0.08)})`;
        ctx.beginPath();
        ctx.moveTo(x, y + 16);
        ctx.lineTo(x + f.w, y + 16);
        ctx.stroke();
        for (let d = 0; d < 3; d++) {
          ctx.fillStyle = `rgba(${c},${a(light, 0.18)})`;
          ctx.beginPath();
          ctx.arc(x + 10 + d * 8, y + 8, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        for (let r = 0; r < 3; r++) {
          ctx.fillStyle = `rgba(${c},${a(light, 0.08)})`;
          rr(ctx, x + 12, y + 28 + r * 16, f.w * (0.35 + ((r + i) % 3) * 0.18), 6, 3);
          ctx.fill();
        }
      });
      if (still) return;
      const k = (now % 3200) / 3200;
      const target = frames[Math.floor(now / 3200) % frames.length]!;
      const tx = Math.min(target.x, w - target.w - 10) + target.w * 0.7;
      const ty = target.y + target.h * 0.7;
      if (k > 0.5) {
        const r = (k - 0.5) * 2 * 40;
        ctx.strokeStyle = `rgba(${GOLD(light)},${((1 - (k - 0.5) * 2) * 0.5).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(tx, ty, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(${c},${a(light, 0.35)})`;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + 11, ty + 4);
      ctx.lineTo(tx + 5, ty + 6);
      ctx.lineTo(tx + 3, ty + 12);
      ctx.closePath();
      ctx.fill();
    },
  };
}

/* Search: a radar sweep that lights points as it passes them. */
function radar(w: number, h: number, rand: Rand): Scene {
  const cx = w * 0.75;
  const cy = h * 0.5;
  const R = Math.min(w, h) * 0.42;
  const pts = Array.from({ length: 22 }, () => ({ ang: rand() * Math.PI * 2, r: R * (0.15 + rand() * 0.85) }));
  return {
    draw(ctx, now, _dt, light, still) {
      const c = C(light);
      ctx.lineWidth = 1;
      for (const m of [0.33, 0.66, 1]) {
        ctx.strokeStyle = `rgba(${c},${a(light, 0.07)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, R * m, 0, Math.PI * 2);
        ctx.stroke();
      }
      const sweep = still ? 0 : ((now / 4200) * Math.PI * 2) % (Math.PI * 2);
      const g = ctx.createConicGradient ? ctx.createConicGradient(sweep - 0.6, cx, cy) : null;
      if (g) {
        g.addColorStop(0, `rgba(${c},0)`);
        g.addColorStop(0.095, `rgba(${c},${light ? 0.08 : 0.1})`);
        g.addColorStop(0.1, `rgba(${c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const p of pts) {
        const since = (((sweep - p.ang) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const v = Math.max(0, 1 - since / 2.5);
        const x = cx + Math.cos(p.ang) * p.r;
        const y = cy + Math.sin(p.ang) * p.r;
        ctx.fillStyle = `rgba(${GOLD(light)},${(0.08 + v * 0.5).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, 2 + v * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}

/* RMS: orders arriving at a gate; most pass on (blue), a few are turned back (gold). */
function gate(w: number, h: number, rand: Rand): Scene {
  const gx = w * (w < 640 ? 0.55 : 0.62);
  const orders: { y: number; x: number; vx: number; back: boolean; turned: boolean }[] = [];
  let last = 0;
  return {
    draw(ctx, now, dt, light, still) {
      const c = C(light);
      ctx.lineWidth = 1;
      // The gate: a column of short bars with a soft light.
      for (let y = h * 0.1; y < h * 0.9; y += 26) {
        ctx.strokeStyle = `rgba(${c},${a(light, 0.12)})`;
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.lineTo(gx, y + 12);
        ctx.stroke();
      }
      const lg = ctx.createLinearGradient(gx - 60, 0, gx + 60, 0);
      lg.addColorStop(0, `rgba(${c},0)`);
      lg.addColorStop(0.5, `rgba(${c},${light ? 0.05 : 0.06})`);
      lg.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = lg;
      ctx.fillRect(gx - 60, h * 0.08, 120, h * 0.84);
      if (still) return;
      if (now - last > 260) {
        last = now;
        orders.push({ y: h * (0.12 + rand() * 0.76), x: -10, vx: 120 + rand() * 80, back: rand() < 0.16, turned: false });
      }
      for (let k = orders.length - 1; k >= 0; k--) {
        const o = orders[k]!;
        o.x += o.vx * dt;
        if (o.back && !o.turned && o.x >= gx - 8) {
          o.turned = true;
          o.vx = -o.vx * 0.7;
        }
        if (o.x > w + 20 || o.x < -20) {
          orders.splice(k, 1);
          continue;
        }
        const rgb = o.turned ? GOLD(light) : c;
        ctx.strokeStyle = `rgba(${rgb},${a(light, 0.25)})`;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(o.x - Math.sign(o.vx) * 26, o.y);
        ctx.stroke();
        glow(ctx, o.x, o.y, 6, rgb, light ? 0.5 : 0.6);
        if (o.turned && Math.abs(o.x - gx) < 40) glow(ctx, gx, o.y, 20, GOLD(light), 0.3);
      }
    },
  };
}

export const PAGE_SCENES: Record<PageScene, (w: number, h: number, rand: Rand) => Scene> = {
  pipeline,
  modules,
  journey,
  table,
  orgchart,
  orbit,
  code,
  spotlight,
  growth,
  screens,
  radar,
  gate,
};
