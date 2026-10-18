"use client";

import Image from "next/image";
import { useRef, type CSSProperties, type PointerEvent } from "react";

export type PhoneShot = { url: string; alt: string; width: number | null; height: number | null };

type Labels = { trade: string; buy: string; sell: string; account: string; steps: [string, string, string, string]; verify: string; verifying: string; illustration: string };

/**
 * Three phones floating side by side, tilting gently towards the pointer. They show
 * real phone screenshots when the products have them (Admin → Products → Screens,
 * device "Phone"); until then, drawn screens of the trading app, BO account opening
 * and eKYC, with no figures in them, marked as an illustration.
 */
export function PhoneStage({ shots, labels }: { shots: PhoneShot[]; labels: Labels }) {
  const stage = useRef<HTMLDivElement>(null);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = stage.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", String((e.clientX - r.left) / r.width - 0.5));
    el.style.setProperty("--py", String((e.clientY - r.top) / r.height - 0.5));
  };
  const reset = () => {
    stage.current?.style.setProperty("--px", "0");
    stage.current?.style.setProperty("--py", "0");
  };
  const real = shots.slice(0, 3);
  const drawn = [<ScreenTrade key="t" labels={labels} />, <ScreenAccount key="a" labels={labels} />, <ScreenKyc key="k" labels={labels} />];
  const screens = [0, 1, 2].map((i) =>
    real[i] ? <Image key={i} src={real[i]!.url} alt={real[i]!.alt} fill sizes="16rem" quality={90} className="object-cover object-top" /> : drawn[i],
  );

  return (
    <div ref={stage} onPointerMove={onMove} onPointerLeave={reset} className="ps relative mx-auto flex h-[30rem] w-full max-w-3xl items-center justify-center overflow-x-clip md:h-[36rem] lg:overflow-visible">
      <span aria-hidden="true" className="ps-glow pointer-events-none absolute top-1/2 left-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      {[1, 0, 2].map((i) => (
        <div key={i} className={`ps-phone ps-phone-${i}`} style={{ "--i": i } as CSSProperties}>
          <div className="ps-frame relative h-full w-full overflow-hidden rounded-[2.2rem] border-[7px] border-[#0b1424] bg-[#0b1424] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)] ring-1 ring-white/10">
            <span aria-hidden="true" className="absolute top-2 left-1/2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
            <div className="relative h-full w-full overflow-hidden rounded-[1.7rem] bg-[#f5f8fc] dark:bg-[#0e1a2c]">{screens[i]}</div>
          </div>
        </div>
      ))}
      {real.length < 3 && <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[11px] text-text-secondary">{labels.illustration}</p>}
    </div>
  );
}

const bar = "rounded-full bg-[color-mix(in_srgb,var(--color-fg)_12%,transparent)]";

function ScreenTrade({ labels }: { labels: Labels }) {
  return (
    <div className="flex h-full flex-col gap-3 px-4 pt-9 pb-4 text-[10px] text-text-primary">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold">{labels.trade}</span>
        <span className="size-6 rounded-full bg-gradient-to-br from-brand-royal to-brand-sky" />
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-brand-royal to-brand-sky p-3 text-white">
        <span className={`block h-2 w-16 rounded-full bg-white/40`} />
        <svg viewBox="0 0 200 70" className="ps-line mt-2 h-16 w-full" aria-hidden="true">
          <path d="M0 55 C20 50 30 58 45 46 S70 30 85 36 110 50 125 32 150 14 165 22 190 10 200 6" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 55 C20 50 30 58 45 46 S70 30 85 36 110 50 125 32 150 14 165 22 190 10 200 6 V70 H0 Z" fill="url(#psfill)" opacity="0.35" />
          <defs>
            <linearGradient id="psfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((r) => (
          <div key={r} className="flex items-center gap-2">
            <span className="size-6 rounded-lg bg-[color-mix(in_srgb,var(--color-brand-sky)_18%,transparent)]" />
            <span className="flex flex-1 flex-col gap-1">
              <span className={`${bar} h-1.5 w-2/3`} />
              <span className={`${bar} h-1.5 w-1/3`} />
            </span>
            <span className={`h-3 w-8 rounded-md ${r % 2 ? "bg-[#e5534b]/30" : "bg-[#25b16a]/30"}`} />
          </div>
        ))}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2">
        <span className="rounded-xl bg-[#25b16a] py-2 text-center text-[11px] font-semibold text-white">{labels.buy}</span>
        <span className="rounded-xl bg-[#e5534b] py-2 text-center text-[11px] font-semibold text-white">{labels.sell}</span>
      </div>
    </div>
  );
}

function ScreenAccount({ labels }: { labels: Labels }) {
  return (
    <div className="flex h-full flex-col gap-4 px-4 pt-9 pb-4 text-[10px] text-text-primary">
      <span className="font-display text-sm font-semibold">{labels.account}</span>
      <span className="relative block h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-fg)_10%,transparent)]">
        <span className="ps-progress absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-sky to-gold" />
      </span>
      <ol className="flex flex-col gap-2.5">
        {labels.steps.map((s, i) => (
          <li key={s} className="ps-step flex items-center gap-2.5 rounded-xl border border-fg/10 px-2.5 py-2" style={{ "--s": i } as CSSProperties}>
            <span className="ps-tick flex size-5 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-fg)_10%,transparent)] text-white">
              <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
                <path d="m2.5 6 2.2 2.2L9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="font-medium">{s}</span>
          </li>
        ))}
      </ol>
      <span className="mt-auto rounded-xl bg-gradient-to-r from-brand-royal to-brand-sky py-2 text-center text-[11px] font-semibold text-white">→</span>
    </div>
  );
}

function ScreenKyc({ labels }: { labels: Labels }) {
  return (
    <div className="flex h-full flex-col items-center gap-4 px-4 pt-9 pb-4 text-[10px] text-text-primary">
      <span className="self-start font-display text-sm font-semibold">{labels.verify}</span>
      <div className="relative mt-2 flex aspect-square w-4/5 items-center justify-center">
        {["top-0 left-0 border-t-2 border-l-2 rounded-tl-xl", "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl", "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl", "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl"].map((c) => (
          <span key={c} className={`absolute size-6 border-brand-sky ${c}`} />
        ))}
        <svg viewBox="0 0 100 100" className="h-3/4 w-3/4 text-[color-mix(in_srgb,var(--color-fg)_25%,transparent)]" aria-hidden="true">
          <circle cx="50" cy="38" r="18" fill="currentColor" />
          <path d="M16 92c4-20 18-30 34-30s30 10 34 30" fill="currentColor" />
        </svg>
        <span className="ps-scan absolute inset-x-2 h-0.5 rounded-full bg-brand-sky shadow-[0_0_12px_2px] shadow-brand-sky/60" />
      </div>
      <span className="flex items-center gap-1.5 font-medium text-brand-sky">
        <span className="ps-dot size-1.5 rounded-full bg-brand-sky" />
        {labels.verifying}
      </span>
      <span className={`${bar} mt-auto h-2 w-3/4`} />
      <span className={`${bar} h-2 w-1/2`} />
    </div>
  );
}
