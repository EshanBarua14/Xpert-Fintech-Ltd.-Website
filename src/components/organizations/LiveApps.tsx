import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import { monogram } from "./LogoWall";

export type LiveApp = {
  id: string;
  appName: string;
  brokerage: string | null;
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
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {apps.map((a, i) => {
        const href = a.playStoreUrl ?? a.appStoreUrl ?? a.webUrl;
        const linkLabel = a.playStoreUrl ? labels.android : a.appStoreUrl ? labels.ios : labels.web;
        const inner = (
          <>
            <span aria-hidden="true" className="live-app-pulse absolute inset-0 rounded-3xl" style={{ "--i": i } as CSSProperties} />
            <span className="relative flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-sky/30 bg-gradient-to-br from-brand-sky/20 to-brand-royal/20 font-mono text-[11px] font-semibold tracking-wider text-cyan-300">
                {monogram(a.appName)}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-display text-base font-semibold text-text-primary">{a.appName}</span>
                {a.brokerage && <span className="truncate text-xs text-text-secondary">{a.brokerage}</span>}
              </span>
            </span>
            {href && (
              <span className="relative mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-sky">
                <span className="size-1.5 rounded-full bg-market-up shadow-[0_0_8px_2px_rgb(34_197_94/0.5)]" aria-hidden="true" />
                {linkLabel} <span aria-hidden="true">↗</span>
              </span>
            )}
          </>
        );
        const cls = cn(
          "spotlight glass group relative flex h-full flex-col overflow-hidden rounded-3xl p-5 transition-transform duration-500",
          href && "hover:-translate-y-1",
        );
        return (
          <li key={a.id} data-reveal style={{ "--d": i % 5 } as CSSProperties}>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                {inner}
              </a>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
