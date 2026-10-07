import Image from "next/image";
import type { Member } from "@/lib/public/flagship";
import { monogram } from "./LogoWall";

/**
 * Clients (Admin → Organizations, type "Client") as one row of sliding tiles,
 * each name on a single line. A logo is shown only
 * when it is uploaded and permission to use it is on file; otherwise the name.
 * Pauses on hover; static and wrapped for reduced motion.
 */
export function ClientMarquee({ clients, label }: { clients: Member[]; label: string }) {
  if (!clients.length) return null;
  const rows = [clients];
  return (
    <div aria-label={label} role="region" className="flex flex-col gap-4">
      {/* Screen readers get the plain list once; the moving copies are hidden from them. */}
      <ul className="sr-only">
        {clients.map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>
      {rows.map((row, r) => {
        // Repeat short rows so the strip always overflows the screen, then double for the loop.
        const base = row.length < 6 ? [...row, ...row, ...row] : row.length < 10 ? [...row, ...row] : row;
        const loop = [...base, ...base];
        return (
          <div key={r} className="marquee overflow-hidden" aria-hidden="true">
            <ul className="marquee-track gap-4 pr-4" style={{ animationDuration: `${Math.max(30, base.length * 5)}s` }}>
              {loop.map((c, i) => {
                const tile = (
                  <span className="group glass flex h-16 items-center justify-center gap-3 rounded-2xl px-5 whitespace-nowrap transition-colors duration-300 hover:border-brand-sky/40 sm:h-20 sm:px-6">
                    {c.logo ? (
                      <Image src={c.logo.url} alt="" width={c.logo.width ?? 200} height={c.logo.height ?? 80} className="member-logo h-11 w-auto max-w-[12rem] object-contain sm:h-14 sm:max-w-[15rem]" />
                    ) : (
                      <>
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand-sky/25 bg-brand-sky/10 font-mono text-[max(11px,0.6875rem)] font-semibold text-cyan-300">
                          {monogram(c.name, c.shortName)}
                        </span>
                        <span className="text-sm font-semibold text-text-secondary transition-colors group-hover:text-fg sm:text-base">{c.name}</span>
                      </>
                    )}
                  </span>
                );
                return (
                  <li key={`${c.id}-${i}`} className={i >= row.length ? "ticker-copy shrink-0" : "shrink-0"}>
                    {c.websiteUrl ? (
                      <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
                        {tile}
                      </a>
                    ) : (
                      tile
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
