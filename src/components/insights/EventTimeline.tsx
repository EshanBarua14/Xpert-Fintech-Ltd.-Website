import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { TimelineEvent } from "@/lib/public/insights";
import { cn } from "@/lib/utils/cn";

export type EventTimelineLabels = { photos: string; with: string; open: string };

/**
 * Events as a timeline, newest first and grouped by year. The latest event
 * is the large card; every event shows its date as a tile (or its cover
 * photo beside it), where it was held, how many photos it has, and the
 * organizations that took part, linked to their websites.
 */
export function EventTimeline({ events, labels, locale }: { events: TimelineEvent[]; labels: EventTimelineLabels; locale: "en" | "bn" }) {
  const nf = (v: number) => new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { useGrouping: false }).format(v);
  const years: { year: number | null; items: TimelineEvent[] }[] = [];
  for (const e of events) {
    const last = years[years.length - 1];
    if (last && last.year === e.year) last.items.push(e);
    else years.push({ year: e.year, items: [e] });
  }
  let n = 0;
  return (
    <div className="flex flex-col gap-12">
      {years.map((g) => (
        <section key={g.year ?? "undated"} className="grid gap-6 lg:grid-cols-[9rem_1fr]">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-text-primary/80 lg:sticky lg:top-36 lg:self-start">{g.year ? nf(g.year) : "—"}</h2>
          <ol className="relative flex flex-col gap-5 border-l border-fg/10 pl-6 md:pl-8">
            {g.items.map((e) => {
              const i = n++;
              const featured = i === 0;
              return (
                <li key={e.id} data-reveal style={{ "--d": i % 4 } as CSSProperties} className="relative">
                  <span aria-hidden="true" className={cn("absolute top-7 -left-[1.95rem] size-3 rounded-full ring-4 ring-ink-950 md:-left-[2.45rem]", featured ? "bg-gold" : "bg-brand-sky")} />
                  <article className={cn("spotlight glass group relative grid gap-5 overflow-hidden rounded-3xl p-5 transition-transform duration-500 hover:-translate-y-0.5 md:p-6", featured && e.cover ? "md:grid-cols-[1.1fr_1fr]" : "sm:grid-cols-[auto_1fr]")}>
                    {featured && e.cover ? (
                      <span className="relative block aspect-[16/10] overflow-hidden rounded-2xl bg-navy-800">
                        <Image src={e.cover.url} alt={e.cover.alt ?? ""} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                      </span>
                    ) : e.cover ? (
                      <span className="relative block h-24 w-36 shrink-0 overflow-hidden rounded-2xl bg-navy-800">
                        <Image src={e.cover.url} alt={e.cover.alt ?? ""} fill sizes="9rem" className="object-cover" />
                      </span>
                    ) : (
                      <span aria-hidden="true" className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border border-brand-sky/25 bg-gradient-to-br from-brand-sky/15 to-brand-royal/10">
                        {e.day ? (
                          <>
                            <span className="font-display text-3xl leading-none font-semibold text-text-primary">{e.day}</span>
                            <span className="mt-1 text-xs font-semibold text-brand-sky">{e.month}</span>
                          </>
                        ) : (
                          // Month only (the day is not confirmed): month and year, smaller.
                          <>
                            <span className="px-1 text-center font-display text-sm leading-tight font-semibold text-text-primary">{e.month ?? "—"}</span>
                            {e.year && <span className="mt-1 text-xs font-semibold text-brand-sky">{nf(e.year)}</span>}
                          </>
                        )}
                      </span>
                    )}
                    <div className="flex min-w-0 flex-col gap-2.5">
                      {e.date && <time className="font-mono text-xs text-cyan-300">{e.date}</time>}
                      <h3 className={cn("font-display font-semibold tracking-tight text-balance", featured ? "text-2xl md:text-3xl" : "text-xl")}>
                        <Link href={e.href} className="after:absolute after:inset-0 after:content-['']">
                          {e.title}
                        </Link>
                      </h3>
                      {e.summary && <p className={cn("text-sm leading-relaxed text-text-secondary", !featured && "line-clamp-2")}>{e.summary}</p>}
                      <p className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                        {e.location && <span className="rounded-full border border-fg/10 px-2.5 py-1">{e.location}</span>}
                        {e.photos > 0 && <span className="rounded-full border border-fg/10 px-2.5 py-1">{labels.photos.replace("{n}", nf(e.photos))}</span>}
                      </p>
                      {e.orgs.length > 0 && (
                        <p className="relative z-10 flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="text-text-secondary">{labels.with}</span>
                          {e.orgs.map((o) =>
                            o.url ? (
                              <a key={o.name} href={o.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-fg/[0.05] px-2.5 py-1 text-text-primary transition-colors hover:bg-brand-sky/15 hover:text-brand-sky">
                                {o.name}
                              </a>
                            ) : (
                              <span key={o.name} className="rounded-full bg-fg/[0.05] px-2.5 py-1 text-text-primary">
                                {o.name}
                              </span>
                            ),
                          )}
                        </p>
                      )}
                      <span aria-hidden="true" className="mt-1 text-sm font-semibold text-brand-sky">{labels.open}</span>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
