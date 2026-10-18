"use client";

import { focusStyle } from "@/lib/media/focal";
import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import { departmentColor, departmentLabel, departmentRank } from "@/lib/people/departments";
import { cn } from "@/lib/utils/cn";
import { ContactIcon, WebsiteIcon } from "./ContactIcon";

export type TeamMember = {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  photo: { url: string; width?: number | null; height?: number | null; focal?: { x: number; y: number; zoom?: number | null } | null } | null;
  email: string | null;
  linkedinUrl: string | null;
  /** Their own website; Xpert's home page when empty. */
  websiteUrl?: string | null;
};

export type TeamLabels = { filter: string; everyone: string; showing: string; email: string; linkedin: string; linkedinSearch: string; emailMissing: string; /** Department names by lower-case department, from Site text. */ departments: Record<string, string> };

function initials(name: string) {
  return name
    .replace(/^(md|mohd|mohammad|muhammad)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/**
 * Everyone at Xpert in order of position (Admin → People, "Team" order).
 * Each card carries its department's colour: a stripe along the top, the
 * avatar behind the initials when there is no photo, and the dot by the
 * department name. The chips filter by department; "Everyone" keeps the
 * full order.
 */
export function TeamDirectory({ people, locale, labels }: { people: TeamMember[]; locale: string; labels: TeamLabels }) {
  const departments = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of people) if (p.department) counts.set(p.department, (counts.get(p.department) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => departmentRank(a[0]) - departmentRank(b[0]) || a[0].localeCompare(b[0]));
  }, [people]);
  const [active, setActive] = useState<string | null>(null);
  const shown = active ? people.filter((p) => p.department === active) : people;
  const nf = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US");

  return (
    <div className="flex flex-col gap-8">
      {departments.length > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label={labels.filter} className="flex flex-wrap gap-2">
            <Chip pressed={active === null} onClick={() => setActive(null)} label={labels.everyone} count={nf.format(people.length)} />
            {departments.map(([d, n]) => (
              <Chip key={d} pressed={active === d} onClick={() => setActive(active === d ? null : d)} label={departmentLabel(d, locale, labels.departments)} count={nf.format(n)} color={departmentColor(d)} />
            ))}
          </div>
          <p aria-live="polite" className="text-sm text-text-secondary">
            {labels.showing.replace("{n}", nf.format(shown.length))}
          </p>
        </div>
      )}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
        {shown.map((p, i) => (
          <li key={p.id} data-reveal style={{ "--d": i % 4 } as CSSProperties}>
            <MemberCard p={p} locale={locale} labels={labels} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Chip({ pressed, onClick, label, count, color }: { pressed: boolean; onClick: () => void; label: string; count: string; color?: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      style={color ? ({ "--dept": color } as CSSProperties) : undefined}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
        pressed ? "border-fg/70 bg-fg text-ink-950" : "border-fg/15 text-text-primary hover:border-fg/40",
      )}
    >
      {color && <span aria-hidden="true" className="size-2.5 rounded-full bg-[var(--dept)] ring-1 ring-white/40" />}
      {label}
      <span className={cn("tabular-nums", pressed ? "opacity-70" : "text-text-secondary")}>{count}</span>
    </button>
  );
}

/** One person: a 4:5 portrait with the department on a chip and the name and title on a soft shade at its foot, then the contacts. */
function MemberCard({ p, locale, labels }: { p: TeamMember; locale: string; labels: TeamLabels }) {
  const color = departmentColor(p.department);
  return (
    <article
      style={{ "--dept": color } as CSSProperties}
      className="team-card group relative flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-fg/[0.08] bg-navy-900 shadow-[0_20px_50px_-36px_rgb(0_0_0/0.6)] transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--dept)_55%,transparent)] hover:shadow-[0_30px_60px_-34px_color-mix(in_srgb,var(--dept)_50%,transparent)]"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[color-mix(in_srgb,var(--dept)_22%,var(--color-navy-800))]">
        {p.photo ? (
          <Image
            src={p.photo.url}
            alt={p.name}
            fill
            sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 23vw, (min-width: 640px) 31vw, 48vw"
            quality={90}
            className="person-photo object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            style={focusStyle(p.photo, 0.8)}
          />
        ) : (
          <span aria-hidden="true" className="flex h-full items-center justify-center pb-16">
            <span className="flex size-16 items-center justify-center rounded-full bg-[var(--dept)] font-display text-2xl text-white ring-4 ring-white/10">{initials(p.name)}</span>
          </span>
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[#050d19]/95 via-[#050d19]/50 to-transparent" />
        {p.department && (
          <span className="absolute top-3 left-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full border border-white/15 bg-[#050d19]/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[var(--dept)]" />
            <span className="truncate">{departmentLabel(p.department, locale, labels.departments)}</span>
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3.5 sm:p-4">
          <h3 className="font-display text-base leading-tight font-semibold text-balance text-white drop-shadow-[0_2px_8px_rgb(0_0_0/0.45)] sm:text-[1.05rem]">{p.name}</h3>
          {p.title && <p className="text-xs leading-snug text-white/80">{p.title}</p>}
        </div>
      </div>
      <div className="mt-auto flex items-center gap-1.5 px-3.5 py-3 sm:px-4">
        {/* Email and LinkedIn on every card: a link when it is on file, a muted icon until it is added (Admin → People → Contacts). */}
        <ContactIcon kind="email" value={p.email} name={p.name} labels={labels} color="var(--dept)" ink="var(--dept)" size="size-8" />
        <ContactIcon kind="linkedin" value={p.linkedinUrl} name={p.name} org="Xpert Fintech" labels={labels} color="var(--dept)" ink="var(--dept)" size="size-8" />
        <WebsiteIcon href={p.websiteUrl || `/${locale}`} name="Xpert Fintech Ltd." label={locale === "bn" ? "ওয়েবসাইট" : "Website"} color="var(--dept)" ink="var(--dept)" size="size-8" />
        <span aria-hidden="true" className="ml-auto h-1 w-8 rounded-full bg-[var(--dept)] opacity-70 transition-[width] duration-500 group-hover:w-12" />
      </div>
    </article>
  );
}
