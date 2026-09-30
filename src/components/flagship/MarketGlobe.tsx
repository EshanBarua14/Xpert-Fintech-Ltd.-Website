"use client";

import { useEffect, useRef } from "react";

type Vec = [number, number, number];

const DEG = Math.PI / 180;

/** Latitude/longitude → point on the unit sphere. */
function toVec(lat: number, lon: number): Vec {
  return [Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos(lon * DEG)];
}

function slerp(a: Vec, b: Vec, t: number): Vec {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-5) return a;
  const s = Math.sin(omega);
  const k1 = Math.sin((1 - t) * omega) / s;
  const k2 = Math.sin(t * omega) / s;
  return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
}

/* The two exchanges, at their real locations. */
const DHAKA = toVec(23.73, 90.41);
const CHATTOGRAM = toVec(22.33, 91.83);

/**
 * Conceptual hero visual: a dotted globe turned towards Bangladesh, with
 * order routes arcing into Dhaka (DSE) and Chattogram (CSE).
 * Decorative only — no data is shown. Pauses off-screen; a single still
 * frame is drawn for visitors who prefer reduced motion.
 */
export function MarketGlobe({ routes = 12, labels = { dse: "DSE", cse: "CSE" } }: { routes?: number; labels?: { dse: string; cse: string } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Evenly spread dots (Fibonacci sphere).
    const N = 2600;
    const dots: Vec[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      dots.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }

    // Route origins: spread around the region, deterministic.
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const origins: { from: Vec; to: Vec; speed: number; offset: number }[] = [];
    for (let i = 0; i < routes; i++) {
      const lat = 20 + (rand() - 0.5) * 80;
      const lon = 90 + (rand() - 0.5) * 140;
      origins.push({ from: toVec(lat, lon), to: i % 3 === 2 ? CHATTOGRAM : DHAKA, speed: 0.00008 + rand() * 0.00008, offset: rand() });
    }

    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(0);
    });
    ro.observe(canvas);

    const tilt = 0.36; // tip the globe so Bangladesh (≈23°N) sits near the centre

    function project(v: Vec, yaw: number, R: number, cx: number, cy: number) {
      const x1 = v[0] * Math.cos(yaw) - v[2] * Math.sin(yaw);
      const z1 = v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw);
      const y2 = v[1] * Math.cos(tilt) - z1 * Math.sin(tilt);
      const z2 = v[1] * Math.sin(tilt) + z1 * Math.cos(tilt);
      return { x: cx + x1 * R, y: cy - y2 * R, z: z2 };
    }

    function draw(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const R = Math.min(width, height) * 0.42;
      const cx = width / 2;
      const cy = height / 2;
      // Face Bangladesh (lon 90°), swaying gently.
      const yaw = 90 * DEG + Math.sin(t * 0.00012) * 0.5;

      // Atmosphere
      const glow = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.35);
      glow.addColorStop(0, "rgba(34,188,235,0.10)");
      glow.addColorStop(1, "rgba(34,188,235,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Rim
      ctx.strokeStyle = "rgba(103,232,249,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // Dots
      for (const d of dots) {
        const p = project(d, yaw, R, cx, cy);
        if (p.z < -0.1) continue;
        const a = p.z > 0 ? 0.22 + p.z * 0.7 : 0.06;
        ctx.fillStyle = `rgba(125,200,255,${a.toFixed(3)})`;
        const size = p.z > 0 ? 1.2 + p.z * 0.9 : 0.8;
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }

      // Routes
      for (const o of origins) {
        const pts: { x: number; y: number; z: number }[] = [];
        for (let i = 0; i <= 40; i++) {
          const s = i / 40;
          const v = slerp(o.from, o.to, s);
          const lift = 1 + Math.sin(Math.PI * s) * 0.3;
          pts.push(project([v[0] * lift, v[1] * lift, v[2] * lift], yaw, R, cx, cy));
        }
        ctx.lineWidth = 1.3;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1]!;
          const b = pts[i]!;
          if (a.z < -0.05 && b.z < -0.05) continue;
          ctx.strokeStyle = `rgba(56,200,245,${(0.14 + Math.max(0, b.z) * 0.5).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        // Travelling pulse
        const phase = reduce ? o.offset : (t * o.speed + o.offset) % 1;
        const idx = Math.floor(phase * 40);
        const head = pts[idx];
        if (head && head.z > -0.05) {
          const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 6);
          g.addColorStop(0, "rgba(186,245,255,0.95)");
          g.addColorStop(1, "rgba(34,188,235,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(head.x, head.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Exchanges
      const markers: [Vec, string][] = [
        [DHAKA, labels.dse],
        [CHATTOGRAM, labels.cse],
      ];
      for (const [v, label] of markers) {
        const p = project(v, yaw, R, cx, cy);
        if (p.z < 0) continue;
        const pulse = reduce ? 0.5 : (t * 0.0008) % 1;
        ctx.strokeStyle = `rgba(103,232,249,${(0.8 * (1 - pulse)).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 + pulse * 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#e0fbff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "600 12px ui-monospace, SFMono-Regular, monospace";
        ctx.fillStyle = "rgba(224,251,255,0.9)";
        ctx.fillText(label, p.x + 10, p.y + (label === labels.cse ? 16 : -8));
      }
    }

    let raf = 0;
    let visible = true;
    const loop = (t: number) => {
      draw(t);
      if (visible) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduce) raf = requestAnimationFrame(loop);
    });

    if (reduce) draw(0);
    else {
      io.observe(canvas);
      raf = requestAnimationFrame(loop);
    }
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (visible && !reduce) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [routes, labels.dse, labels.cse]);

  return <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full" />;
}
