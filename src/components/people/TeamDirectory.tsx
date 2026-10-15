"use client";

import { focusStyle } from "@/lib/media/focal";
import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import { departmentColor, departmentLabel, departmentRank } from "@/lib/people/departments";
import { cn } from "@/lib/utils/cn";
import { ContactIcon } from "./ContactIcon";

export type TeamMember = {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  photo: { url: string; width?: number | null; height?: number | null; focal?: { x: number; y: number; zoom?: number | null } | null } | null;
  email: string | null;
  linkedinUrl: string | null;
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

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

/** One person: a standard 4:5 portrait across the top of the card (initials on the department colour without one), then name, title, department and contacts. */
function MemberCard({ p, locale, labels }: { p: TeamMember; locale: string; labels: TeamLabels }) {
  const color = departmentColor(p.department);
  return (
    <article
      style={{ "--dept": color } as CSSProperties}
      className="team-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-fg/[0.09] bg-navy-900 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--dept)_55%,transparent)]"
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-1 bg-[var(--dept)]" />
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[color-mix(in_srgb,var(--dept)_22%,var(--color-navy-800))]">
        {p.photo ? (
          <Image
            src={p.photo.url}
            alt={p.name}
            fill
            sizes="(min-width: 1280px) 18rem, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            quality={90}
            className="person-photo object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            style={focusStyle(p.photo, 0.8)}
          />
        ) : (
          <span aria-hidden="true" className="flex h-full items-center justify-center">
            <span className="flex size-28 items-center justify-center rounded-full bg-[var(--dept)] font-display text-4xl text-white ring-4 ring-white/10">{initials(p.name)}</span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="font-display text-lg leading-tight text-balance text-text-primary">{p.name}</h3>
        {p.title && <p className="text-sm leading-snug text-text-secondary">{p.title}</p>}
      </div>
      <div className="mx-5 mt-auto flex min-h-9 items-center gap-3 border-t border-fg/[0.08] py-4">
        {p.department && (
          <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-text-secondary">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-[var(--dept)]" />
            <span className="truncate">{departmentLabel(p.department, locale, labels.departments)}</span>
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          {/* Email and LinkedIn on every card: a link when it is on file, a muted icon until it is added (Admin → People → Contacts). */}
          <ContactIcon kind="email" value={p.email} name={p.name} labels={labels} color="var(--dept)" ink="var(--dept)" />
          <ContactIcon kind="linkedin" value={p.linkedinUrl} name={p.name} org="Xpert Fintech" labels={labels} color="var(--dept)" ink="var(--dept)" />
        </span>
      </div>
    </article>
  );
}
