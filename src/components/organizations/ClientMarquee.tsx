import Image from "next/image";
import type { Member } from "@/lib/public/flagship";
import { monogram } from "./LogoWall";

/**
 * Clients (Admin → Organizations, type "Client") as sliding logo tiles. With
 * eight or more, two rows slide in opposite directions. A logo is shown only
 * when it is uploaded and permission to use it is on file; otherwise the name.
 * Pauses on hover; static and wrapped for reduced motion.
 */
export function ClientMarquee({ clients, label }: { clients: Member[]; label: string }) {
  if (!clients.length) return null;
  const rows = clients.length >= 8 ? [clients.filter((_, i) => i % 2 === 0), clients.filter((_, i) => i % 2 === 1)] : [clients];
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
        const base = row.length < 6 ? [...row, ...row, ...row] : row;
        const loop = [...base, ...base];
        return (
          <div key={r} className="marquee overflow-hidden" aria-hidden="true">
            <ul className={"marquee-track gap-4 pr-4" + (r === 1 ? " marquee-reverse" : "")} style={{ animationDuration: `${Math.max(30, base.length * 5)}s` }}>
              {loop.map((c, i) => {
                const tile = (
                  <span className="group glass flex h-20 w-48 items-center justify-center gap-3 rounded-2xl px-5 transition-colors duration-300 hover:border-brand-sky/40 sm:h-24 sm:w-56">
                    {c.logo ? (
                      <Image src={c.logo.url} alt="" width={c.logo.width ?? 200} height={c.logo.height ?? 80} className="member-logo h-10 w-auto max-w-[9.5rem] object-contain sm:h-12" />
                    ) : (
                      <>
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand-sky/25 bg-brand-sky/10 font-mono text-[10px] font-semibold text-cyan-300">
                          {monogram(c.name, c.shortName)}
                        </span>
                        <span className="line-clamp-2 text-sm leading-snug font-semibold text-text-secondary transition-colors group-hover:text-fg">{c.name}</span>
                      </>
                    )}
                  </span>
                );
                return (
                  <li key={`${c.id}-${i}`} className="shrink-0">
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
