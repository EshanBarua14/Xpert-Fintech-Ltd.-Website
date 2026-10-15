import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import { monogram } from "./LogoWall";

export type LiveApp = {
  id: string;
  appName: string;
  brokerage: string | null;
  /** The brokerage's own website, when known. */
  brokerageUrl?: string | null;
  /** The brokerage's logo (with permission), shown instead of the app's initials. */
  logo?: { url: string; width: number | null; height: number | null } | null;
  playStoreUrl: string | null;
  appStoreUrl: string | null;
  webUrl: string | null;
  /** Shown large, above the others (Admin → Deployments → Featured). */
  featured?: boolean;
  /** One or two lines about the app (Admin → Deployments). */
  summary?: string | null;
};

type Labels = { android: string; ios: string; web: string; featured?: string };
type StoreLink = { href: string; label: string; kind: "play" | "ios" | "web" };

/** Every public link the app has: Google Play, App Store and the web app. */
function linksOf(a: LiveApp, labels: Labels): StoreLink[] {
  return [
    a.playStoreUrl && { href: a.playStoreUrl, label: labels.android, kind: "play" as const },
    a.appStoreUrl && { href: a.appStoreUrl, label: labels.ios, kind: "ios" as const },
    a.webUrl && { href: a.webUrl, label: labels.web, kind: "web" as const },
  ].filter((l): l is StoreLink => Boolean(l));
}

/** The featured app: its brokerage's logo large, what it is, and its store buttons at full size. */
function FeaturedApp({ a, labels }: { a: LiveApp; labels: Labels }) {
  const links = linksOf(a, labels);
  return (
    <div data-reveal className="beam glass relative grid gap-6 overflow-hidden rounded-[2rem] p-6 sm:p-8 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-10 md:p-10">
      <span aria-hidden="true" className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-brand-sky/15 blur-3xl" />
      {a.logo ? (
        <span className="relative flex h-24 w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-black/5 md:h-28 md:w-52">
          <Image src={a.logo.url} alt="" width={a.logo.width ?? 240} height={a.logo.height ?? 120} sizes="13rem" quality={90} className="h-full w-full object-contain" />
        </span>
      ) : (
        <span className="relative flex size-24 shrink-0 items-center justify-center rounded-2xl border border-brand-sky/30 bg-gradient-to-br from-brand-sky/20 to-brand-royal/20 font-mono text-xl font-semibold tracking-wider text-accent">
          {monogram(a.appName)}
        </span>
      )}
      <span className="relative flex min-w-0 flex-col gap-2">
        {labels.featured && (
          <span className="flex items-center gap-2 text-sm font-semibold text-gold">
            <span aria-hidden="true" className="inline-block h-4 w-0.5 rounded-full bg-gold" />
            {labels.featured}
          </span>
        )}
        <span className="font-display text-3xl leading-tight font-semibold tracking-[-0.02em] text-text-primary md:text-4xl">{a.appName}</span>
        {a.brokerage &&
          (a.brokerageUrl ? (
            <a href={a.brokerageUrl} target="_blank" rel="noopener noreferrer" className="self-start text-base text-text-secondary underline decoration-fg/20 underline-offset-4 transition-colors hover:text-brand-sky hover:decoration-brand-sky/60">
              {a.brokerage}
            </a>
          ) : (
            <span className="text-base text-text-secondary">{a.brokerage}</span>
          ))}
        {a.summary && <span className="max-w-2xl text-sm leading-relaxed text-text-secondary">{a.summary}</span>}
      </span>
      {links.length > 0 && (
        <span className="relative flex flex-wrap gap-2 md:flex-col md:items-stretch">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${a.appName}: ${l.label}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-brand-sky/40 bg-brand-sky/10 px-5 text-sm font-semibold whitespace-nowrap text-text-primary transition-colors hover:border-brand-sky hover:bg-brand-sky/20"
            >
              <StoreGlyph kind={l.kind} />
              {l.label}
            </a>
          ))}
        </span>
      )}
    </div>
  );
}

/**
 * Branded trading apps that consortium brokerages run on the platform, each
 * linking to its public store listing — evidence anyone can check. Tiles light
 * up in sequence like orders printing on a board; static for reduced motion.
 */
export function LiveApps({ apps: all, labels }: { apps: LiveApp[]; labels: Labels }) {
  if (!all.length) return null;
  // The first featured app gets its own large card; the rest follow as tiles.
  const lead = all.find((a) => a.featured);
  const apps = lead ? all.filter((a) => a !== lead) : all;
  return (
    <div className="flex flex-col gap-3">
    {lead && <FeaturedApp a={lead} labels={labels} />}
    {apps.length > 0 && (
    // Rows of equal cards; a short last row sits in the middle instead of hanging to the left.
    <ul className="flex flex-wrap justify-center gap-3">
      {apps.map((a, i) => {
        const links = linksOf(a, labels);
        return (
          <li
            key={a.id}
            data-reveal
            style={{ "--d": i % 5 } as CSSProperties}
            className={cn(
              "w-full min-[420px]:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-2.25rem)/4)]",
              apps.length % 5 === 0 && apps.length % 4 !== 0 && "xl:w-[calc((100%-3rem)/5)]",
            )}
          >
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
                  {a.brokerage &&
                    (a.brokerageUrl ? (
                      <a href={a.brokerageUrl} target="_blank" rel="noopener noreferrer" className="line-clamp-2 self-start text-xs leading-snug text-text-secondary underline decoration-fg/20 underline-offset-2 transition-colors hover:text-brand-sky hover:decoration-brand-sky/60">
                        {a.brokerage}
                      </a>
                    ) : (
                      <span className="line-clamp-2 text-xs leading-snug text-text-secondary">{a.brokerage}</span>
                    ))}
                </span>
              </span>
              {links.length > 0 && (
                <span className="relative mt-auto flex flex-wrap gap-1.5 pt-4">
                  {links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${a.appName}: ${l.label}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-fg/15 px-2.5 text-xs font-semibold whitespace-nowrap text-brand-sky transition-colors hover:border-brand-sky/60 hover:text-fg"
                    >
                      <StoreGlyph kind={l.kind} />
                      {l.label}
                    </a>
                  ))}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
    )}
    </div>
  );
}

/** A small generic mark for each kind of link: a play triangle, a phone, a globe. */
function StoreGlyph({ kind }: { kind: "play" | "ios" | "web" }) {
  const common = { "aria-hidden": true as const, viewBox: "0 0 16 16", className: "size-3.5 shrink-0" };
  if (kind === "play") return <svg {...common} fill="currentColor"><path d="M4 2.6v10.8c0 .5.5.8.9.5l8.4-5.4a.6.6 0 0 0 0-1L4.9 2.1c-.4-.3-.9 0-.9.5Z" /></svg>;
  if (kind === "ios")
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="4" y="1.5" width="8" height="13" rx="2" />
        <path d="M7 12.2h2" />
      </svg>
    );
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" />
    </svg>
  );
}
