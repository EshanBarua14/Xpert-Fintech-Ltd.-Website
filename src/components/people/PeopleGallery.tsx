"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { cn } from "@/lib/utils/cn";

/**
 * Board and management profiles: photo cards that open a full profile in a
 * dialog (photo, role, biography, email, LinkedIn). Email and LinkedIn also
 * sit on the card itself as icon links (next to the card button, never inside it). Keyboard and screen-reader
 * friendly: cards are buttons, the native dialog keeps focus inside, Esc
 * closes it and focus returns to the card. Motion is skipped for
 * reduced-motion users (see .person-* rules in globals.css).
 */

export type GalleryPerson = {
  id: string;
  name: string;
  title: string | null;
  /** Position outside Xpert, e.g. "Managing Director, Apex Investments Ltd.". */
  affiliation: string | null;
  bio: string | null;
  photo: { url: string; width: number | null; height: number | null } | null;
  linkedinUrl: string | null;
  email: string | null;
  /** Seeded stand-in until XFL sends the real profile. */
  isPlaceholder: boolean;
  /** The organization named in the affiliation, when its logo may be shown. */
  org?: { name: string; logo: { url: string; width: number | null; height: number | null } } | null;
};

export type GalleryLabels = {
  viewProfile: string;
  close: string;
  biography: string;
  bioPending: string;
  linkedin: string;
  /** "Email {name}" */
  email: string;
  placeholder: string;
  role: string;
};

const PLACEHOLDER_PHOTO = "/placeholders/person.svg";

/** One card's width: 1, 2, 3 or 4 across with 1.25rem gaps. */
const COLUMN = "w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)] xl:w-[calc((100%-3.75rem)/4)]";

/** Email and LinkedIn as round icon links. */
function ContactLinks({ p, labels, size = "sm" }: { p: GalleryPerson; labels: GalleryLabels; size?: "sm" | "lg" }) {
  if (!p.email && !p.linkedinUrl) return null;
  const cls =
    size === "sm"
      ? "flex size-10 items-center justify-center rounded-full border border-white/20 bg-[#05080f]/70 text-white backdrop-blur-md transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-brand-sky/70 hover:bg-brand-royal/80 focus-visible:border-brand-sky"
      : "inline-flex h-11 items-center gap-2 rounded-full border border-fg/15 px-5 text-sm font-semibold text-brand-sky transition-colors hover:border-brand-sky/60";
  return (
    <>
      {p.email && (
        <a href={`mailto:${p.email}`} className={cls} aria-label={labels.email.replace("{name}", p.name)} title={p.email}>
          <SocialIcon kind="email" className={size === "sm" ? "size-[18px]" : "size-4"} />
          {size === "lg" && <span className="font-mono text-[max(13px,0.8125rem)] font-medium">{p.email}</span>}
        </a>
      )}
      {p.linkedinUrl && (
        <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" className={cls} aria-label={`${labels.linkedin}: ${p.name}`} title={labels.linkedin}>
          <SocialIcon kind="linkedin" className={size === "sm" ? "size-[17px]" : "size-4"} />
          {size === "lg" && (
            <span>
              {labels.linkedin} <span aria-hidden="true">↗</span>
            </span>
          )}
        </a>
      )}
    </>
  );
}

/** With editor hints on: a missing email or LinkedIn, as a dashed icon that opens the place to add it. */
function ContactSlot({ kind, name }: { kind: "email" | "linkedin"; name: string }) {
  const what = kind === "email" ? "email" : "LinkedIn";
  return (
    <a
      href="/admin/people/contacts"
      aria-label={`Add ${what} for ${name} (Admin)`}
      title={`No ${what} yet: add it in Admin → People → Contacts`}
      className="flex size-9 items-center justify-center rounded-full border border-dashed border-gold/60 text-gold transition-colors hover:border-gold hover:bg-gold/10"
    >
      <SocialIcon kind={kind} className="size-4" />
    </a>
  );
}

/** The organization a person comes from, as a logo on a white plate. */
function OrgLogo({ org, className }: { org: NonNullable<GalleryPerson["org"]>; className?: string }) {
  return (
    <span title={org.name} className={cn("inline-flex items-center justify-center rounded-lg bg-white px-2 py-1 shadow-[0_6px_18px_-8px_rgb(0_0_0/0.45)] ring-1 ring-black/5", className)}>
      <Image src={org.logo.url} alt={org.name} width={org.logo.width ?? 160} height={org.logo.height ?? 64} className="h-full w-auto max-w-[7.5rem] object-contain" />
    </span>
  );
}

/**
 * One profile card: portrait with the person's title as a chip and their
 * organization's logo, then name, title, organization, a few lines of the
 * biography, contact icons and "View profile". The accent colour comes from
 * the group (board gold, management blue, consultant teal; see .people-tone-*).
 */
function PersonCard({
  p,
  labels,
  groupLabel,
  showPlaceholderBadge,
  onOpen,
}: {
  p: GalleryPerson;
  labels: GalleryLabels;
  groupLabel: string;
  showPlaceholderBadge: boolean;
  featured?: boolean;
  onOpen: (trigger: HTMLButtonElement) => void;
}) {
  const role = p.title ?? groupLabel;
  const hasContact = Boolean(p.email || p.linkedinUrl);
  return (
    <article className="person-card group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-fg/[0.08] bg-navy-900 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--tone)_55%,transparent)] hover:shadow-[0_30px_70px_-34px_color-mix(in_srgb,var(--tone)_55%,transparent)]">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-[var(--tone)] via-[color-mix(in_srgb,var(--tone)_50%,transparent)] to-transparent" />
      {/* The portrait also opens the profile; the name button below is the one in the tab order. */}
      <button type="button" tabIndex={-1} aria-hidden="true" onClick={(e) => onOpen(e.currentTarget)} className="relative block aspect-[4/5] w-full overflow-hidden bg-navy-800">
        <Image
          src={p.photo?.url ?? PLACEHOLDER_PHOTO}
          alt=""
          width={p.photo?.width ?? 480}
          height={p.photo?.height ?? 600}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="person-photo h-full w-full object-cover object-top"
          unoptimized={!p.photo}
        />
        <span aria-hidden="true" className="person-sheen pointer-events-none absolute inset-0" />
        <span className="absolute top-4 left-4 inline-flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border border-white/15 bg-[#05080f]/65 px-3 py-1 text-[max(11px,0.6875rem)] font-semibold text-white backdrop-blur-md">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[var(--tone)]" />
          <span className="truncate">{groupLabel}</span>
        </span>
        {showPlaceholderBadge && p.isPlaceholder && (
          <span className="absolute top-4 right-4 rounded-md bg-[#06111f]/85 px-2 py-0.5 text-[max(11px,0.6875rem)] font-semibold text-[#e0b252]">{labels.placeholder}</span>
        )}
        {p.org && <OrgLogo org={p.org} className="absolute bottom-4 left-4 h-9" />}
      </button>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-display text-[1.4rem] leading-tight text-text-primary">
            <button type="button" aria-haspopup="dialog" data-person={p.id} onClick={(e) => onOpen(e.currentTarget)} className="person-name text-left focus-visible:outline-offset-4">
              {p.name}
            </button>
          </h3>
          <p className="text-sm font-semibold text-[var(--tone-ink)]">{role}</p>
          {p.affiliation && <p className="text-sm leading-snug text-text-secondary">{p.affiliation}</p>}
        </div>
        {p.bio && <p className="line-clamp-3 text-sm leading-relaxed text-text-secondary/90">{p.bio}</p>}
        <div className="mt-auto flex items-center gap-2 border-t border-fg/[0.08] pt-4">
          {p.email ? (
            <a
              href={`mailto:${p.email}`}
              aria-label={labels.email.replace("{name}", p.name)}
              title={p.email}
              className="flex size-9 items-center justify-center rounded-full border border-fg/15 text-text-secondary transition-colors hover:border-[var(--tone)] hover:text-fg"
            >
              <SocialIcon kind="email" className="size-4" />
            </a>
          ) : (
            showPlaceholderBadge && <ContactSlot kind="email" name={p.name} />
          )}
          {p.linkedinUrl ? (
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
          ) : (
            showPlaceholderBadge && <ContactSlot kind="linkedin" name={p.name} />
          )}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={(e) => onOpen(e.currentTarget)}
            className={cn("ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--tone-ink)] transition-[gap] hover:gap-2.5", !hasContact && !showPlaceholderBadge && "ml-0")}
          >
            {labels.viewProfile}
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current stroke-[1.8]"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </button>
        </div>
      </div>
    </article>
  );
}

export function PeopleGallery({
  people,
  labels,
  showPlaceholderBadge,
  groupLabel,
  featureFirst = false,
  tone = "management",
}: {
  people: GalleryPerson[];
  labels: GalleryLabels;
  /** True outside production, so editors can spot stand-ins. */
  showPlaceholderBadge: boolean;
  /** Shown as the role when a person has no title yet, e.g. "Management". */
  groupLabel: string;
  /** Board and management: the first person (Chairman, MD) sits alone on the top row, same card size, centred. */
  featureFirst?: boolean;
  /** Accent colour of the cards and profile: board gold, management blue, consultant teal. */
  tone?: "board" | "management" | "consultant" | "team";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState<GalleryPerson | null>(null);

  const show = (p: GalleryPerson, trigger: HTMLButtonElement) => {
    // Focus goes back to the name button (the portrait button is not in the tab order).
    triggerRef.current = trigger.closest("article")?.querySelector<HTMLButtonElement>(".person-name") ?? trigger;
    setOpen(p);
    // Open after the content has rendered so the dialog sizes itself correctly.
    requestAnimationFrame(() => dialogRef.current?.showModal());
  };
  const close = () => dialogRef.current?.close();

  if (!people.length) return null;

  return (
    <div className={`people-tone-${tone}`}>
      {featureFirst && people.length > 2 && (
        <ul className="mb-5 flex justify-center">
          {/* Exactly one grid column wide, so the lead card matches the others. */}
          <li data-reveal className={COLUMN}>
            <PersonCard p={people[0]!} labels={labels} groupLabel={groupLabel} showPlaceholderBadge={showPlaceholderBadge} featured={false} onOpen={(t) => show(people[0]!, t)} />
          </li>
        </ul>
      )}
      {/* Centred rows, so a short last row (e.g. three managers under the MD) sits in the middle. */}
      <ul className="flex flex-wrap justify-center gap-5">
        {(featureFirst && people.length > 2 ? people.slice(1) : people).map((p, i) => (
          <li key={p.id} data-reveal style={{ "--d": i % 4 } as CSSProperties} className={COLUMN}>
            <PersonCard p={p} labels={labels} groupLabel={groupLabel} showPlaceholderBadge={showPlaceholderBadge} featured={false} onOpen={(t) => show(p, t)} />
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-labelledby="person-dialog-name"
        onClose={() => {
          setOpen(null);
          triggerRef.current?.focus();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="person-dialog m-auto border-t-[3px] border-t-[var(--tone)] max-h-[calc(100dvh-2rem)] w-[min(60rem,calc(100vw-2rem))] overflow-auto rounded-[1.75rem] border border-fg/10 bg-navy-900 p-0 text-text-primary shadow-[0_60px_160px_-40px_rgb(0_0_0/0.8)] backdrop:bg-ink-950/75 backdrop:backdrop-blur-sm"
      >
        {open && (
          <div className="relative grid md:grid-cols-[20rem_1fr]">
            <button
              type="button"
              onClick={close}
              aria-label={labels.close}
              className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full border border-fg/15 bg-navy-900/80 text-lg text-text-primary backdrop-blur transition-colors hover:border-brand-sky/60"
            >
              <span aria-hidden="true">×</span>
            </button>
            <div className="relative aspect-[4/5] max-h-[24rem] overflow-hidden bg-navy-800 md:aspect-auto md:max-h-none md:min-h-[28rem]">
              <Image
                src={open.photo?.url ?? PLACEHOLDER_PHOTO}
                alt={open.name}
                fill
                sizes="(min-width: 768px) 20rem, 100vw"
                className="object-cover"
                unoptimized={!open.photo}
              />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-900/70 to-transparent md:bg-none" />
            </div>
            <div className="flex flex-col gap-6 p-7 md:p-10">
              <div className="flex flex-col gap-2 pr-10">
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--tone-ink)]">
                  <span aria-hidden="true" className="size-2 rounded-full bg-[var(--tone)]" />
                  {open.title ?? groupLabel}
                </p>
                <h2 id="person-dialog-name" className="font-display text-3xl leading-tight font-semibold tracking-[-0.02em] md:text-4xl">
                  {open.name}
                </h2>
                {showPlaceholderBadge && open.isPlaceholder && (
                  <span className="self-start rounded-md border border-gold/50 px-2 py-0.5 text-[max(11px,0.6875rem)] font-semibold text-gold">
                    {labels.placeholder}
                  </span>
                )}
              </div>
              {open.org && <OrgLogo org={open.org} className="h-11 self-start" />}
              <dl className="grid gap-1 border-l-2 border-[var(--tone)] pl-5">
                <dt className="text-xs text-text-secondary">{labels.role}</dt>
                <dd className="text-text-primary">{open.title ?? groupLabel}</dd>
                {open.affiliation && <dd className="text-text-secondary">{open.affiliation}</dd>}
              </dl>
              <section className="flex flex-col gap-3">
                <h3 className="text-xs text-text-secondary">{labels.biography}</h3>
                {open.bio ? (
                  open.bio.split(/\n{2,}/).map((para, i) => (
                    <p key={i} className="leading-relaxed text-text-primary/90">
                      {para}
                    </p>
                  ))
                ) : (
                  <p className="text-text-secondary italic">{labels.bioPending}</p>
                )}
              </section>
              {(open.email || open.linkedinUrl) && (
                <div className="mt-auto flex flex-wrap gap-3">
                  <ContactLinks p={open} labels={labels} size="lg" />
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
