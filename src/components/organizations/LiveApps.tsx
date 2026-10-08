import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import { monogram } from "./LogoWall";

export type LiveApp = {
  id: string;
  appName: string;
  brokerage: string | null;
  /** The brokerage's logo (with permission), shown instead of the app's initials. */
  logo?: { url: string; width: number | null; height: number | null } | null;
  playStoreUrl: string | null;
  appStoreUrl: string | null;
  webUrl: string | null;
};

/**
 * Branded trading apps that consortium brokerages run on the platform, each
 * linking to its public store listing — evidence anyone can check. Tiles light
 * up in sequence like orders printing on a board; static for reduced motion.
 */
export function LiveApps({ apps, labels }: { apps: LiveApp[]; labels: { android: string; ios: string; web: string } }) {
  if (!apps.length) return null;
  return (
    <ul className={cn("grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4", apps.length % 5 === 0 && apps.length % 4 !== 0 && "xl:grid-cols-5")}>
      {apps.map((a, i) => {
        // Every public link the app has: Google Play, App Store and the web app.
        const links = [
          a.playStoreUrl && { href: a.playStoreUrl, label: labels.android },
          a.appStoreUrl && { href: a.appStoreUrl, label: labels.ios },
          a.webUrl && { href: a.webUrl, label: labels.web },
        ].filter((l): l is { href: string; label: string } => Boolean(l));
        return (
          <li key={a.id} data-reveal style={{ "--d": i % 5 } as CSSProperties}>
            <div className="spotlight glass group relative flex h-full flex-col overflow-hidden rounded-3xl p-4 sm:p-5">
              <span aria-hidden="true" className="live-app-pulse absolute inset-0 rounded-3xl" style={{ "--i": i } as CSSProperties} />
              <span className="relative flex flex-col items-start gap-3">
                {a.logo ? (
                  <span className="flex h-11 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-black/5">
                    <Image src={a.logo.url} alt="" width={a.logo.width ?? 120} height={a.logo.height ?? 60} className="h-full w-full object-contain" />
                  </span>
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-sky/30 bg-gradient-to-br from-brand-sky/20 to-brand-royal/20 font-mono text-[max(11px,0.6875rem)] font-semibold tracking-wider text-accent">
                    {monogram(a.appName)}
                  </span>
                )}
                <span className="flex w-full min-w-0 flex-col">
                  <span className="font-display text-sm leading-snug font-semibold text-text-primary sm:text-base">{a.appName}</span>
                  {a.brokerage && <span className="line-clamp-2 text-xs leading-snug text-text-secondary">{a.brokerage}</span>}
                </span>
              </span>
              {links.length > 0 && (
                <span className="relative mt-auto flex flex-wrap gap-2 pt-4">
                  {links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${a.appName}: ${l.label}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-fg/15 px-3 text-xs font-semibold text-brand-sky transition-colors hover:border-brand-sky/60 hover:text-fg"
                    >
                      <span className="size-1.5 rounded-full bg-market-up shadow-[0_0_8px_2px_rgb(34_197_94/0.5)]" aria-hidden="true" />
                      {l.label} <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
