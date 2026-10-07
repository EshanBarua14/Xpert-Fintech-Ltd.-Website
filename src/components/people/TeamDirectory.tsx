"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { departmentColor, departmentLabel, departmentRank } from "@/lib/people/departments";
import { cn } from "@/lib/utils/cn";

export type TeamMember = {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  photo: { url: string } | null;
  email: string | null;
  linkedinUrl: string | null;
};

export type TeamLabels = { filter: string; everyone: string; showing: string; email: string; linkedin: string; /** Department names by lower-case department, from Site text. */ departments: Record<string, string> };

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

function MemberCard({ p, locale, labels }: { p: TeamMember; locale: string; labels: TeamLabels }) {
  const color = departmentColor(p.department);
  return (
    <article
      style={{ "--dept": color } as CSSProperties}
      className="team-card relative flex h-full flex-col gap-5 overflow-hidden rounded-2xl border border-fg/[0.09] bg-navy-900 p-5 pt-6 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--dept)_55%,transparent)]"
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-[var(--dept)]" />
      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-[var(--dept)] ring-2 ring-[color-mix(in_srgb,var(--dept)_35%,transparent)] ring-offset-2 ring-offset-navy-900">
          {p.photo ? (
            <Image src={p.photo.url} alt="" fill sizes="4rem" className="object-cover" />
          ) : (
            <span aria-hidden="true" className="flex h-full items-center justify-center font-display text-xl text-white">
              {initials(p.name)}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-display text-lg leading-tight text-balance text-text-primary">{p.name}</h3>
          {p.title && <p className="text-sm leading-snug text-text-secondary">{p.title}</p>}
        </div>
      </div>
      <div className="mt-auto flex min-h-9 items-center gap-3 border-t border-fg/[0.08] pt-4">
        {p.department && (
          <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-text-secondary">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-[var(--dept)]" />
            <span className="truncate">{departmentLabel(p.department, locale, labels.departments)}</span>
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          {p.email && (
            <a
              href={`mailto:${p.email}`}
              aria-label={labels.email.replace("{name}", p.name)}
              title={p.email}
              className="flex size-9 items-center justify-center rounded-full border border-fg/15 text-text-secondary transition-colors hover:border-fg/40 hover:text-fg"
            >
              <SocialIcon kind="email" className="size-4" />
            </a>
          )}
          {p.linkedinUrl && (
            <a
              href={p.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${labels.linkedin}: ${p.name}`}
              title={labels.linkedin}
              className="flex size-9 items-center justify-center rounded-full border border-fg/15 text-text-secondary transition-colors hover:border-[#0a66c2] hover:bg-[#0a66c2] hover:text-white"
            >
              <SocialIcon kind="linkedin" className="size-4" />
            </a>
          )}
        </span>
      </div>
    </article>
  );
}
