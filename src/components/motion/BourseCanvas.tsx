"use client";

import { useEffect, useRef } from "react";

/* Real DSE / CSE trading codes, used as type only — no prices are shown. */
const CODES = [
  "GP", "SQURPHARMA", "BATBC", "BEXIMCO", "BRACBANK", "RENATA", "WALTONHIL", "ROBI", "LHBL", "ISLAMIBANK",
  "CITYBANK", "OLYMPIC", "MARICO", "UPGDCL", "BERGERPBL", "SUMITPOWER", "BSRMLTD", "POWERGRID", "DUTCHBANGL",
  "EBL", "PUBALIBANK", "IFADAUTOS", "BXPHARMA", "ACI", "SEAPEARL", "UNIQUEHRL", "KPCL", "BSCCL", "SINGERBD",
  "UCB", "PRIMEBANK", "NBL", "MJLBD", "IDLC", "DBH", "LANKABAFIN", "TITASGAS", "JAMUNAOIL", "PADMAOIL", "MPETROLEUM",
  "DSEX", "DS30", "DSES", "CASPI", "CSE30",
];

type Cell = { code: string; y: number };
type Column = { x: number; speed: number; cells: Cell[] };

/**
 * The site's backdrop: a faint, slowly rising board of trading codes in
 * columns, where codes briefly light up gold as if a trade printed, over a
 * soft index line drifting across the lower part of the screen. Decorative
 * only: no figures, no axes. 30 fps, paused when the tab is hidden, and a
 * single still frame for visitors who prefer reduced motion.
 */
export function BourseCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let columns: Column[] = [];
    const ROW = 34;
    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pick = () => CODES[Math.floor(rand() * CODES.length)]!;
    const flashes = new Map<Cell, number>(); // cell → start time

    const build = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      const gap = w < 640 ? 170 : 150;
      columns = [];
      for (let x = 24; x < w; x += gap) {
        const cells: Cell[] = [];
        const offset = rand() * ROW;
        for (let y = -ROW + offset; y < h + ROW; y += ROW) cells.push({ code: pick(), y });
        columns.push({ x: x + (rand() - 0.5) * 30, speed: 6 + rand() * 10, cells });
      }
    };
    build();

    let phase = 0;
    const indexY = (x: number) => {
      // Smooth, non-repeating-looking line from layered sines (decorative, no values).
      const t = x * 0.004 + phase;
      return h * 0.86 + Math.sin(t) * 30 + Math.sin(t * 2.3 + 1.7) * 18 + Math.sin(t * 5.1 + 0.4) * 7 - (x / w) * 60;
    };

    let last = performance.now();
    let lastFlash = 0;
    const draw = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const light = document.documentElement.dataset.theme === "light";
      ctx.clearRect(0, 0, w, h);

      // Index ribbon
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = indexY(x);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = light ? "rgba(10,120,173,0.22)" : "rgba(34,188,235,0.22)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const fill = ctx.createLinearGradient(0, h * 0.75, 0, h);
      fill.addColorStop(0, light ? "rgba(10,120,173,0.06)" : "rgba(34,188,235,0.07)");
      fill.addColorStop(1, "rgba(34,188,235,0)");
      ctx.fillStyle = fill;
      ctx.fill();

      // Trading board
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textBaseline = "middle";
      const base = light ? "rgba(10,20,40,0.055)" : "rgba(160,190,230,0.06)";
      for (const col of columns) {
        for (const cell of col.cells) {
          if (!reduce) cell.y -= col.speed * dt;
          if (cell.y < -ROW) {
            cell.y += Math.ceil((h + ROW * 2) / ROW) * ROW;
            cell.code = pick();
          }
          const started = flashes.get(cell);
          if (started !== undefined) {
            const age = (now - started) / 1400;
            if (age >= 1) {
              flashes.delete(cell);
              ctx.fillStyle = base;
            } else {
              const a = Math.sin(Math.PI * age) * (light ? 0.75 : 0.7);
              ctx.fillStyle = light ? `rgba(138,93,11,${a.toFixed(3)})` : `rgba(224,178,82,${a.toFixed(3)})`;
            }
          } else {
            ctx.fillStyle = base;
          }
          ctx.fillText(cell.code, col.x, cell.y);
        }
      }

      // A "trade" prints somewhere on the board every few hundred ms.
      if (!reduce && now - lastFlash > 260 && columns.length) {
        lastFlash = now;
        const col = columns[Math.floor(rand() * columns.length)]!;
        const cell = col.cells[Math.floor(rand() * col.cells.length)];
        if (cell && cell.y > 0 && cell.y < h) flashes.set(cell, now);
      }
      if (!reduce) phase += dt * 0.12;
    };

    let raf = 0;
    let prev = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - prev < (w < 768 ? 66 : 33)) return; // ~30 fps (15 on phones) is plenty for a backdrop
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
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="bourse-canvas" />;
}
