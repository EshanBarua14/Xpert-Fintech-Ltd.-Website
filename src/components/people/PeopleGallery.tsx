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

/** Email or LinkedIn not on file yet: the icon, faint and not a link (added in Admin → People → Contacts). */
function MutedIcon({ kind, size = "size-9" }: { kind: "email" | "linkedin"; size?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--tone)_25%,transparent)] text-[color-mix(in_srgb,var(--tone)_50%,transparent)]", size)}>
      <SocialIcon kind={kind} className="size-4" />
    </span>
  );
}

/**
 * A biography cut to fit the profile window: whole paragraphs and sentences
 * up to `max` characters, ending with "…" when something was left out.
 */
function fitBio(bio: string, max: number): string[] {
  const paras = bio.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const out: string[] = [];
  let used = 0;
  for (const para of paras) {
    if (used + para.length <= max) {
      out.push(para);
      used += para.length;
      continue;
    }
    // Fit as many whole sentences of this paragraph as there is room for.
    const sentences = para.match(/[^.!?।]+[.!?।]+["'”’)]*\s*|[^.!?।]+$/g) ?? [para];
    let part = "";
    for (const sen of sentences) {
      if (used + part.length + sen.length > max) break;
      part += sen;
    }
    if (part.trim()) out.push(`${part.trim()} …`);
    else if (!out.length) out.push(`${para.slice(0, max).replace(/\s+\S*$/, "")} …`);
    else out[out.length - 1] = `${out[out.length - 1]} …`;
    break;
  }
  return out;
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
  return (
    <article
      // The whole card opens the profile (links inside it keep their own action); the name button is the keyboard route.
      onClick={(e) => {
        if ((e.target as Element).closest("a, button")) return;
        const name = e.currentTarget.querySelector<HTMLButtonElement>(".person-name");
        if (name) onOpen(name);
      }}
      className="person-card group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.6rem] border border-fg/[0.08] bg-navy-900 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--tone)_60%,transparent)]"
    >
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
        <div className="mt-auto flex items-center gap-2 border-t border-fg/[0.08] pt-4">
          {p.email ? (
            <a
              href={`mailto:${p.email}`}
              aria-label={labels.email.replace("{name}", p.name)}
              title={p.email}
              className="flex size-9 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--tone)_45%,transparent)] text-[var(--tone-ink)] transition-colors hover:border-[var(--tone)] hover:bg-[var(--tone)] hover:text-white"
            >
              <SocialIcon kind="email" className="size-4" />
            </a>
          ) : showPlaceholderBadge ? (
            <ContactSlot kind="email" name={p.name} />
          ) : (
            <MutedIcon kind="email" />
          )}
          {p.linkedinUrl ? (
            <a
              href={p.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${labels.linkedin}: ${p.name}`}
              title={labels.linkedin}
              className="flex size-9 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--tone)_45%,transparent)] text-[var(--tone-ink)] transition-colors hover:border-[var(--tone)] hover:bg-[var(--tone)] hover:text-white"
            >
              <SocialIcon kind="linkedin" className="size-4" />
            </a>
          ) : showPlaceholderBadge ? (
            <ContactSlot kind="linkedin" name={p.name} />
          ) : (
            <MutedIcon kind="linkedin" />
          )}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={(e) => onOpen(e.currentTarget)}
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--tone-ink)] transition-[gap] hover:gap-2.5"
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
        className="person-dialog m-auto h-fit max-h-[calc(100dvh-1.5rem)] w-[min(72rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.75rem] border border-t-[3px] border-fg/10 border-t-[var(--tone)] bg-navy-900 p-0 text-text-primary shadow-[0_60px_160px_-40px_rgb(0_0_0/0.8)] backdrop:bg-ink-950/75 backdrop:backdrop-blur-sm"
      >
        {open && (
          // One screen, no scrolling: the photo fills the left column on wide screens and becomes a portrait beside the name on phones;
          // the biography is cut to fit (see fitBio) and its type scales with the window height.
          <div className="relative grid max-h-[calc(100dvh-1.5rem)] md:grid-cols-[minmax(15rem,21rem)_1fr]">
            <button
              type="button"
              onClick={close}
              aria-label={labels.close}
              className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full border border-fg/15 bg-navy-900/80 text-lg text-text-primary backdrop-blur transition-colors hover:border-[var(--tone)] hover:text-[var(--tone-ink)]"
            >
              <span aria-hidden="true">×</span>
            </button>
            <div className="relative hidden overflow-hidden bg-navy-800 md:block">
              <Image src={open.photo?.url ?? PLACEHOLDER_PHOTO} alt={open.name} fill sizes="21rem" className="object-cover object-top" unoptimized={!open.photo} />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06111f]/60 via-transparent to-transparent" />
              {open.org && <OrgLogo org={open.org} className="absolute bottom-4 left-4 h-10" />}
            </div>
            <div className="person-dialog-body flex min-h-0 flex-col gap-[clamp(0.75rem,2svh,1.5rem)] p-5 sm:p-7 md:p-9">
              <div className="flex items-center gap-4 pr-10">
                <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-navy-800 md:hidden">
                  <Image src={open.photo?.url ?? PLACEHOLDER_PHOTO} alt="" fill sizes="5rem" className="object-cover object-top" unoptimized={!open.photo} />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[var(--tone-ink)]">
                    <span aria-hidden="true" className="size-2 rounded-full bg-[var(--tone)]" />
                    {open.title ?? groupLabel}
                  </p>
                  <h2 id="person-dialog-name" className="font-display text-[clamp(1.5rem,3.4svh,2.25rem)] leading-tight font-semibold tracking-[-0.02em] text-balance">
                    {open.name}
                  </h2>
                  {open.affiliation && <p className="text-sm leading-snug text-text-secondary">{open.affiliation}</p>}
                </div>
              </div>
              {showPlaceholderBadge && open.isPlaceholder && (
                <span className="self-start rounded-md border border-gold/50 px-2 py-0.5 text-[max(11px,0.6875rem)] font-semibold text-gold">{labels.placeholder}</span>
              )}
              <section aria-label={labels.biography} className="flex min-h-0 flex-col gap-[0.7em] border-l-2 border-[var(--tone)] pl-4 text-[clamp(13px,1.75svh,15.5px)] leading-[1.62] text-text-primary/90">
                {open.bio ? (
                  <>
                    {/* Phones get a shorter cut than wide screens, and short phones a shorter one still. */}
                    {fitBio(open.bio, 420).map((para, i) => (
                      <p key={`s${i}`} className="md:hidden [@media(min-height:720px)]:hidden">
                        {para}
                      </p>
                    ))}
                    {fitBio(open.bio, 820).map((para, i) => (
                      <p key={`m${i}`} className="hidden [@media(min-height:720px)]:block md:!hidden">
                        {para}
                      </p>
                    ))}
                    {fitBio(open.bio, 1350).map((para, i) => (
                      <p key={`l${i}`} className="hidden md:block">
                        {para}
                      </p>
                    ))}
                  </>
                ) : (
                  <p className="text-text-secondary italic">{labels.bioPending}</p>
                )}
              </section>
              <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-fg/[0.08] pt-4">
                {open.email ? (
                  <a
                    href={`mailto:${open.email}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--tone)_45%,transparent)] px-4 text-sm font-semibold text-[var(--tone-ink)] transition-colors hover:border-[var(--tone)] hover:bg-[var(--tone)] hover:text-white"
                  >
                    <SocialIcon kind="email" className="size-4" />
                    <span className="hidden max-w-[16rem] truncate sm:inline">{open.email}</span>
                    <span className="sr-only sm:hidden">{open.email}</span>
                  </a>
                ) : (
                  <MutedIcon kind="email" size="size-10" />
                )}
                {open.linkedinUrl ? (
                  <a
                    href={open.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--tone)_45%,transparent)] px-4 text-sm font-semibold text-[var(--tone-ink)] transition-colors hover:border-[var(--tone)] hover:bg-[var(--tone)] hover:text-white"
                  >
                    <SocialIcon kind="linkedin" className="size-4" />
                    {labels.linkedin} <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <MutedIcon kind="linkedin" size="size-10" />
                )}
                {open.org && <OrgLogo org={open.org} className="ml-auto h-9 md:hidden" />}
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
