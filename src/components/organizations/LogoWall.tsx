import Image from "next/image";
import type { CSSProperties } from "react";
import type { Member } from "@/lib/public/flagship";
import { cn } from "@/lib/utils/cn";

/**
 * Consortium members as logo tiles. A member's real logo appears once it is
 * uploaded in Admin → Organizations with logo permission ticked; until then
 * the tile shows a monogram, so the wall never looks broken.
 */

/** "Bank Asia Securities Ltd." → "BAS"; skips legal suffixes and "&". */
export function monogram(name: string, shortName?: string | null) {
  if (shortName && shortName.length <= 5) return shortName.toUpperCase();
  const words = name
    .replace(/[.,]/g, "")
    .split(/\s+/)
    .filter((w) => w && !/^(ltd|limited|plc|&|and|of|the)$/i.test(w));
  // Keep a brand acronym as it is: "EBL Securities PLC" → "EBL", "UCB Stock Brokerage" → "UCB".
  if (words[0] && /^[A-Z]{2,4}$/.test(words[0])) return words[0];
  return words
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function Tile({ m, i, size }: { m: Member; i: number; size: "lg" | "sm" }) {
  const inner = (
    <>
      <span
        className={cn(
          "relative flex items-center justify-center",
          size === "lg" ? "h-24 w-full" : "h-14 min-w-0 shrink",
        )}
      >
        {m.logo ? (
          <Image
            src={m.logo.url}
            alt={m.name}
            width={m.logo.width ?? 320}
            height={m.logo.height ?? 120}
            className={cn(
              "member-logo w-auto object-contain",
              size === "lg" ? "max-h-20 max-w-[14rem]" : "max-h-12 max-w-[14rem]",
            )}
          />
        ) : (
          <span
            aria-hidden="true"
            className={cn(
              "flex items-center justify-center rounded-2xl border border-brand-sky/25 bg-gradient-to-br from-brand-sky/15 to-brand-royal/15 font-mono font-semibold tracking-widest text-cyan-300 transition-[box-shadow,border-color] duration-500 group-hover:border-brand-sky/60 group-hover:shadow-[0_0_40px_-10px_rgb(34_188_235/0.8)]",
              size === "lg" ? "size-16 text-sm" : "size-11 text-xs",
            )}
          >
            {monogram(m.name, m.shortName)}
          </span>
        )}
      </span>
      {size === "lg" ? (
        <span className="text-center font-display text-base leading-snug font-semibold text-text-primary">{m.name}</span>
      ) : (
        !m.logo && <span className="min-w-0 text-sm leading-snug font-medium text-text-primary">{m.name}</span>
      )}
    </>
  );
  // Small tiles read as a row: monogram (or logo) and the member's name.
  const cls = cn(
    "spotlight glass group flex h-full rounded-3xl transition-transform duration-500 hover:-translate-y-1",
    size === "lg" ? "min-h-48 flex-col items-center justify-center gap-4 p-6" : "min-h-20 flex-row items-center gap-3 px-4 py-3",
    size === "sm" && m.logo && "justify-center",
  );
  return (
    <li data-reveal style={{ "--d": i % 4 } as CSSProperties}>
      {m.websiteUrl ? (
        <a href={m.websiteUrl} target="_blank" rel="noopener noreferrer" className={cls} aria-label={size === "sm" && m.logo ? m.name : undefined}>
          {inner}
        </a>
      ) : (
        <div className={cls} title={size === "sm" ? m.name : undefined}>
          {inner}
          {size === "sm" && m.logo && <span className="sr-only">{m.name}</span>}
        </div>
      )}
    </li>
  );
}

const COLS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
} as const;

export function LogoWall({ members, size = "lg", columns }: { members: Member[]; size?: "lg" | "sm"; columns?: keyof typeof COLS }) {
  if (!members.length) return null;
  return (
    <ul className={cn("grid gap-3", COLS[columns ?? 4])}>
      {members.map((m, i) => (
        <Tile key={m.id} m={m} i={i} size={size} />
      ))}
    </ul>
  );
}

/** Endless strip of member logos (or names), paused on hover and for reduced motion. */
export function LogoMarquee({ members, label }: { members: Member[]; label: string }) {
  if (!members.length) return null;
  const loop = [...members, ...members];
  return (
    <section aria-label={label} className="relative border-y border-fg/[0.06] bg-fg/[0.015] py-7">
      <p className="sr-only">{members.map((m) => m.name).join(", ")}</p>
      <div className="marquee overflow-hidden" aria-hidden="true">
        <ul className="marquee-track items-center gap-10 pr-10">
          {loop.map((m, i) => (
            <li key={`${m.id}-${i}`} className={cn("flex items-center gap-3 whitespace-nowrap text-sm text-text-secondary", i >= members.length && "ticker-copy")}>
              {m.logo ? (
                <Image src={m.logo.url} alt="" width={m.logo.width ?? 200} height={m.logo.height ?? 80} className="member-logo h-10 w-auto max-w-[12rem] object-contain" />
              ) : (
                <>
                  <span className="flex size-8 items-center justify-center rounded-lg border border-brand-sky/25 bg-brand-sky/10 font-mono text-[max(10px,0.625rem)] font-semibold text-cyan-300">
                    {monogram(m.name, m.shortName)}
                  </span>
                  {m.name}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
