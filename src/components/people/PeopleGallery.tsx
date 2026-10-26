"use client";

import { Logo } from "@/components/brand/Logo";
import { focusStyle } from "@/lib/media/focal";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { cn } from "@/lib/utils/cn";
import { institutionOf, splitAffiliation } from "@/lib/people/affiliation";
import { CodeIcon, ContactIcon, WebsiteIcon } from "./ContactIcon";

/** Their own website, else their organisation's, else Xpert's (the home page). */
const siteOf = (p: GalleryPerson) => p.websiteUrl || p.org?.url || "/";

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
  photo: { url: string; width: number | null; height: number | null; focal?: { x: number; y: number; zoom?: number | null } | null } | null;
  linkedinUrl: string | null;
  email: string | null;
  /** Their own or their organisation's website (Admin → People). */
  websiteUrl?: string | null;
  githubUrl?: string | null;
  /** Seeded stand-in until XFL sends the real profile. */
  isPlaceholder: boolean;
  /** The organization named in the affiliation, when its logo may be shown. */
  org?: { name: string; logo: { url: string; width: number | null; height: number | null }; url?: string | null } | null;
};

export type GalleryLabels = {
  viewProfile: string;
  close: string;
  biography: string;
  bioPending: string;
  linkedin: string;
  /** "Email {name}" */
  email: string;
  /** "Find {name} on LinkedIn" (no LinkedIn on file yet) */
  linkedinSearch: string;
  /** No email on file yet */
  emailMissing: string;
  /** "Website" */
  website?: string;
  placeholder: string;
  role: string;
  /** Biography pages: "Previous part", "Next part", "Part {n} of {total}". */
  prevPage?: string;
  nextPage?: string;
  pageOf?: string;
};

const PLACEHOLDER_PHOTO = "/placeholders/person.svg";

/** One card's width: 1, 2, 3 or 4 across with 1.25rem gaps. */
const COLUMN = "w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)] xl:w-[calc((100%-3.75rem)/4)]";
/** Wide screens: as many per row as avoids one card alone on the last row (5 → 3 + 2, 9 → 3 + 3 + 3). */
const COLUMN_3 = "w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]";
const columnFor = (n: number) => (n % 4 === 1 && n % 3 !== 1 ? COLUMN_3 : COLUMN);

/** With editor hints on: a missing email or LinkedIn, as a dashed icon that opens the place to add it. */
function ContactSlot({ kind, name }: { kind: "email" | "linkedin"; name: string }) {
  const what = kind === "email" ? "email" : "LinkedIn";
  return (
    <Link
      href="/admin/people/contacts"
      aria-label={`Add ${what} for ${name} (Admin)`}
      title={`No ${what} yet: add it in Admin → People → Contacts`}
      className="flex size-9 items-center justify-center rounded-full border border-dashed border-gold/60 text-gold transition-colors hover:border-gold hover:bg-gold/10"
    >
      <SocialIcon kind={kind} className="size-4" />
    </Link>
  );
}

/** Their position elsewhere, on two lines: the designation, then the institution in its own type. */
function Affiliation({ text, className }: { text: string; className?: string }) {
  const { designation, institution } = splitAffiliation(text);
  return (
    <p className={cn("flex flex-col gap-0.5", className)}>
      {designation && <span className="text-sm leading-snug font-medium text-text-primary/85">{designation}</span>}
      {institution && <span className="font-display text-[0.95rem] leading-snug text-[color-mix(in_srgb,var(--tone-ink)_70%,var(--color-text-secondary))]">{institution}</span>}
    </p>
  );
}

/**
 * The whole biography split into pages that each fit the profile window:
 * whole paragraphs where they fit, otherwise whole sentences, up to `max`
 * characters a page. Nothing is left out — long profiles are read page by page.
 */
function pagesOf(bio: string, max: number): string[][] {
  const pages: string[][] = [];
  let page: string[] = [];
  let used = 0;
  const flush = () => {
    if (page.length) pages.push(page);
    page = [];
    used = 0;
  };
  for (const para of bio.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean)) {
    if (used + para.length <= max) {
      page.push(para);
      used += para.length;
      continue;
    }
    // Split this paragraph at sentence ends; a part carries on onto the next page.
    let part = "";
    for (const sen of sentences(para)) {
      if (used + part.length + sen.length > max && (part || used)) {
        if (part.trim()) page.push(part.trim());
        flush();
        part = "";
      }
      part = part ? `${part} ${sen}` : sen;
    }
    if (part.trim()) {
      page.push(part.trim());
      used += part.length;
    }
  }
  flush();
  return pages;
}

/** Sentences of a paragraph, not split after titles and abbreviations ("Mr.", "Md.", "Ltd.", "Dr.", "e.g.", initials). */
const ABBR = /(?:^|\s)(?:Mr|Mrs|Ms|Md|Mohd|Dr|Prof|Engr|Ltd|Co|Inc|Jr|Sr|St|No|vs|etc|e\.g|i\.e|[A-Z])\.$/;
function sentences(para: string): string[] {
  const out: string[] = [];
  let cur = "";
  for (const piece of para.split(/(?<=[.!?।]["'”’)]*)\s+/)) {
    cur = cur ? `${cur} ${piece}` : piece;
    if (!ABBR.test(cur)) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** Characters a biography page holds in this window (phones, short screens and wide screens differ). */
function pageBudget() {
  if (typeof window === "undefined") return 1300;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w < 768) return h < 720 ? 380 : 560;
  return h < 760 ? 800 : h < 900 ? 1050 : 1300;
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
  company,
  showPlaceholderBadge,
  onOpen,
}: {
  p: GalleryPerson;
  labels: GalleryLabels;
  groupLabel: string;
  company?: string;
  showPlaceholderBadge: boolean;
  featured?: boolean;
  onOpen: (trigger: HTMLButtonElement) => void;
}) {
  const title = p.title ?? groupLabel;
  return (
    <article
      // The whole card opens the profile (links inside it keep their own action); the name button is the keyboard route.
      onClick={(e) => {
        if ((e.target as Element).closest("a, button")) return;
        const name = e.currentTarget.querySelector<HTMLButtonElement>(".person-name");
        if (name) onOpen(name);
      }}
      className="person-card group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border border-fg/[0.08] bg-navy-900 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--tone)_55%,transparent)]"
    >
      {/* Portrait, with the name and title set on a soft shade at its foot */}
      <button type="button" tabIndex={-1} aria-hidden="true" onClick={(e) => onOpen(e.currentTarget)} className="relative block aspect-[4/5] w-full overflow-hidden bg-navy-800">
        <Image
          src={p.photo?.url ?? PLACEHOLDER_PHOTO}
          alt=""
          width={p.photo?.width ?? 480}
          height={p.photo?.height ?? 600}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          quality={90}
          className="person-photo h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          style={focusStyle(p.photo, 0.8)}
          unoptimized={!p.photo}
        />
        {/* The portrait stays clean: no shade over the face; name and title sit under it. */}
        {showPlaceholderBadge && p.isPlaceholder && (
          <span className="absolute top-4 right-4 rounded-md bg-[#06111f]/85 px-2 py-0.5 text-[max(11px,0.6875rem)] font-semibold text-[#e0b252]">{labels.placeholder}</span>
        )}
        {p.org && <OrgLogo org={p.org} className="absolute top-4 left-4 h-8" />}
      </button>

      <div className="flex flex-1 flex-col gap-4 border-t-2 border-[color-mix(in_srgb,var(--tone)_55%,transparent)] p-5 sm:p-6">
        <div className="flex flex-col items-start gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--tone)_14%,transparent)] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[var(--tone-ink)] ring-1 ring-[color-mix(in_srgb,var(--tone)_30%,transparent)]">
            <span className="size-1.5 rounded-full bg-[var(--tone)]" />
            {title}
          </span>
          {/* The name opens the profile (keyboard and screen readers too). */}
          <h3 className="font-display text-[1.4rem] leading-tight font-semibold text-balance text-text-primary">
            <button type="button" aria-haspopup="dialog" data-person={p.id} onClick={(e) => onOpen(e.currentTarget)} className="person-name text-left">
              {p.name}
            </button>
          </h3>
        </div>
        {p.affiliation ? (
          <Affiliation text={p.affiliation} />
        ) : (
          company && (
            <p className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <Logo height={18} />
              {company}
            </p>
          )
        )}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 gap-y-2 border-t border-fg/[0.08] pt-4">
          {!p.email && showPlaceholderBadge ? <ContactSlot kind="email" name={p.name} /> : <ContactIcon kind="email" value={p.email} name={p.name} labels={labels} size="size-8" />}
          {!p.linkedinUrl && showPlaceholderBadge ? (
            <ContactSlot kind="linkedin" name={p.name} />
          ) : (
            <ContactIcon kind="linkedin" value={p.linkedinUrl} name={p.name} org={p.org?.name ?? institutionOf(p.affiliation)} labels={labels} size="size-8" />
          )}
          {p.githubUrl && <CodeIcon href={p.githubUrl} name={p.name} size="size-8" />}
          <WebsiteIcon href={siteOf(p)} name={p.org?.name ?? company ?? p.name} label={labels.website} size="size-8" />
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={(e) => onOpen(e.currentTarget)}
            className="ml-auto inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--tone)_14%,transparent)] pr-2.5 pl-3.5 text-[13px] font-semibold whitespace-nowrap text-[var(--tone-ink)] ring-1 ring-[color-mix(in_srgb,var(--tone)_35%,transparent)] transition-[gap,background-color,color,box-shadow] hover:gap-2 hover:bg-[var(--tone)] hover:text-white hover:ring-[var(--tone)]"
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
  company,
  featureFirst = false,
  leadCount = 1,
  tone = "management",
}: {
  people: GalleryPerson[];
  labels: GalleryLabels;
  /** True outside production, so editors can spot stand-ins. */
  showPlaceholderBadge: boolean;
  /** Shown as the role when a person has no title yet, e.g. "Management". */
  groupLabel: string;
  /** Added after the role on board and consultant cards: "Chairman, Xpert Fintech Ltd." */
  company?: string;
  /** Board and management: the first person (Chairman, MD) sits alone on the top row, same card size, centred. */
  featureFirst?: boolean;
  /** How many lead cards share the top row (management: the MD and the CFO). */
  leadCount?: number;
  /** Accent colour of the cards and profile: board gold, management blue, consultant teal. */
  tone?: "board" | "management" | "consultant" | "team";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState<GalleryPerson | null>(null);
  const [page, setPage] = useState(0);
  const [budget, setBudget] = useState(1300);
  const pages = open?.bio ? pagesOf(open.bio, budget) : [];
  const at = Math.min(page, Math.max(0, pages.length - 1));
  const go = (i: number) => setPage(Math.max(0, Math.min(pages.length - 1, i)));
  // A sideways swipe on the biography turns its page on phones.
  const swipeX = useRef<number | null>(null);

  const show = (p: GalleryPerson, trigger: HTMLButtonElement) => {
    // Focus goes back to the name button (the portrait button is not in the tab order).
    triggerRef.current = trigger.closest("article")?.querySelector<HTMLButtonElement>(".person-name") ?? trigger;
    setOpen(p);
    setPage(0);
    setBudget(pageBudget());
    // Open after the content has rendered so the dialog sizes itself correctly.
    requestAnimationFrame(() => dialogRef.current?.showModal());
  };
  const close = () => dialogRef.current?.close();

  if (!people.length) return null;

  return (
    <div className={`people-tone-${tone}`}>
      {/* The lead card(s) on their own row, each exactly one column wide, so they match the cards below. */}
      {featureFirst && people.length > leadCount + 1 && (
        <ul className="mb-5 flex flex-wrap justify-center gap-5">
          {people.slice(0, leadCount).map((p) => (
            <li key={p.id} data-reveal className={COLUMN}>
              <PersonCard p={p} labels={labels} groupLabel={groupLabel} company={company} showPlaceholderBadge={showPlaceholderBadge} featured={false} onOpen={(t) => show(p, t)} />
            </li>
          ))}
        </ul>
      )}
      {/* Centred rows, so a short last row sits in the middle. */}
      <ul className="flex flex-wrap justify-center gap-5">
        {(featureFirst && people.length > leadCount + 1 ? people.slice(leadCount) : people).map((p, i, rest) => (
          <li key={p.id} data-reveal style={{ "--d": i % 4 } as CSSProperties} className={columnFor(rest.length)}>
            <PersonCard p={p} labels={labels} groupLabel={groupLabel} company={company} showPlaceholderBadge={showPlaceholderBadge} featured={false} onOpen={(t) => show(p, t)} />
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
        onKeyDown={(e) => {
          // Arrow keys turn the biography's pages (not while typing in a field).
          if (pages.length < 2 || (e.target as Element).closest("input, textarea")) return;
          if (e.key === "ArrowRight") go(at + 1);
          else if (e.key === "ArrowLeft") go(at - 1);
        }}
        className="person-dialog m-auto h-fit max-h-[calc(100dvh-1.5rem)] w-[min(72rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.75rem] border border-t-[3px] border-fg/10 border-t-[var(--tone)] bg-navy-900 p-0 text-text-primary shadow-[0_60px_160px_-40px_rgb(0_0_0/0.8)] backdrop:bg-ink-950/75 backdrop:backdrop-blur-sm"
      >
        {open && (
          // One screen, no scrolling: the photo fills the left column on wide screens and becomes a portrait beside the name on phones;
          // a long biography is read in pages (see pagesOf) and its type scales with the window height.
          <div className="relative grid max-h-[calc(100dvh-1.5rem)] md:grid-cols-[19rem_1fr]">
            <button
              type="button"
              onClick={close}
              aria-label={labels.close}
              className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full border border-fg/15 bg-navy-900/80 text-lg text-text-primary backdrop-blur transition-colors hover:border-[var(--tone)] hover:text-[var(--tone-ink)]"
            >
              <span aria-hidden="true">×</span>
            </button>
            {/* The portrait in the same 4:5 frame as on the card, whatever the window's height: every profile shows its photo the same way. */}
            {/* Wide screens: the profile card on the left (photo, Xpert's logo, name, designation, links); the biography fills the right. */}
            <div className="relative hidden min-h-0 flex-col gap-4 overflow-y-auto bg-navy-800/50 p-5 md:flex">
              <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-2xl bg-navy-800 ring-1 ring-[color-mix(in_srgb,var(--tone)_35%,transparent)]">
                <Image src={open.photo?.url ?? PLACEHOLDER_PHOTO} alt={open.name} fill sizes="(min-width: 768px) 22rem, 80vw" quality={90} className="object-cover" style={focusStyle(open.photo, 0.8)} unoptimized={!open.photo} />
              </div>
              {/* Name and their seat at Xpert, then their own organisation, each as the same row: logo, organisation, role. */}
              <div className="flex flex-col gap-1">
                <p className="text-center font-display text-[1.35rem] leading-tight font-semibold tracking-[-0.01em] text-balance text-text-primary">{open.name}</p>
              </div>
              <ul className="flex flex-col gap-2">
                <li className="flex items-center gap-3 rounded-xl border border-[color-mix(in_srgb,var(--tone)_35%,transparent)] bg-[color-mix(in_srgb,var(--tone)_8%,transparent)] p-2.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-black/5">
                    <Logo height={26} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm leading-snug font-semibold text-[var(--tone-ink)]">{open.title ?? groupLabel}</span>
                    <span className="truncate text-xs text-text-secondary">{company ?? "Xpert Fintech Ltd."}</span>
                  </span>
                </li>
                {open.affiliation && (
                  <li className="flex items-center gap-3 rounded-xl border border-fg/10 p-2.5">
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5">
                      {open.org ? (
                        <Image src={open.org.logo.url} alt={open.org.name} width={open.org.logo.width ?? 80} height={open.org.logo.height ?? 80} className="h-8 w-8 object-contain" />
                      ) : (
                        <SocialIcon kind="web" className="size-4 text-[#0b1c31]" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm leading-snug font-semibold text-text-primary">{splitAffiliation(open.affiliation).designation || open.affiliation}</span>
                      {splitAffiliation(open.affiliation).institution && (
                        <span className="text-xs leading-snug text-text-secondary">{splitAffiliation(open.affiliation).institution}</span>
                      )}
                    </span>
                  </li>
                )}
              </ul>
              <div className="mt-auto flex flex-col items-center gap-2 border-t border-fg/[0.08] pt-4">
                <div className="flex items-center justify-center gap-2">
                  <ContactIcon kind="email" value={open.email} name={open.name} labels={labels} size="size-10" />
                  <ContactIcon kind="linkedin" value={open.linkedinUrl} name={open.name} org={open.org?.name ?? institutionOf(open.affiliation)} labels={labels} size="size-10" />
                  {open.githubUrl && <CodeIcon href={open.githubUrl} name={open.name} size="size-10" />}
                  <WebsiteIcon href={siteOf(open)} name={open.org?.name ?? company ?? open.name} label={labels.website} size="size-10" />
                </div>
                {open.email && (
                  <a href={`mailto:${open.email}`} className="max-w-full truncate text-xs text-text-secondary hover:text-[var(--tone-ink)]">
                    {open.email}
                  </a>
                )}
              </div>
            </div>
            {/* The biography sits in the middle of its column, in a size that fills the space without crowding it. */}
            <div className="person-dialog-body flex min-h-0 flex-col gap-[clamp(0.75rem,2svh,1.5rem)] p-5 sm:p-7 md:justify-center md:p-10 lg:px-14">
              <div className="flex items-center gap-4 pr-10 md:hidden">
                <span className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-2xl bg-navy-800">
                  <Image src={open.photo?.url ?? PLACEHOLDER_PHOTO} alt="" fill sizes="5rem" quality={90} className="object-cover" style={focusStyle(open.photo, 0.8)} unoptimized={!open.photo} />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[var(--tone-ink)]">
                    <span aria-hidden="true" className="size-2 rounded-full bg-[var(--tone)]" />
                    {company ? `${open.title ?? groupLabel}, ${company}` : (open.title ?? groupLabel)}
                  </p>
                  <h2 id="person-dialog-name" className="font-display text-[clamp(1.5rem,3.4svh,2.25rem)] leading-tight font-semibold tracking-[-0.02em] text-balance">
                    {open.name}
                  </h2>
                  {open.affiliation && <Affiliation text={open.affiliation} />}
                </div>
              </div>
              <p className="hidden pr-12 text-xs font-semibold tracking-[0.18em] text-text-secondary uppercase md:block">{labels.biography}</p>
              {showPlaceholderBadge && open.isPlaceholder && (
                <span className="self-start rounded-md border border-gold/50 px-2 py-0.5 text-[max(11px,0.6875rem)] font-semibold text-gold">{labels.placeholder}</span>
              )}
              <section
                aria-label={labels.biography}
                onTouchStart={(e) => (swipeX.current = e.touches[0]?.clientX ?? null)}
                onTouchEnd={(e) => {
                  const start = swipeX.current;
                  const end = e.changedTouches[0]?.clientX;
                  swipeX.current = null;
                  if (start == null || end == null || Math.abs(end - start) < 45 || pages.length < 2) return;
                  go(end < start ? at + 1 : at - 1);
                }}
                className="flex min-h-0 max-w-[62ch] flex-col gap-[0.8em] border-l-2 border-[var(--tone)] pl-5 text-[clamp(13px,1.75svh,15.5px)] leading-[1.7] text-text-primary/90 md:text-[clamp(14px,2svh,17px)]">
                {pages.length ? (
                  <div key={`${open.id}-${at}`} className={cn("bio-page flex flex-col gap-[0.7em]", pages.length > 1 && "min-h-[8em]")} aria-live="polite">
                    {pages[at]!.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-secondary italic">{labels.bioPending}</p>
                )}
                {pages.length > 1 && (
                  // Page bars in the card's colour (the same bar that underlines the name on hover), with arrows.
                  <div className="mt-[0.4em] flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => go(at - 1)}
                      disabled={at === 0}
                      aria-label={labels.prevPage ?? "Previous"}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-fg/15 text-[var(--tone-ink)] transition-colors hover:border-[var(--tone)] disabled:opacity-35 disabled:hover:border-fg/15"
                    >
                      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current stroke-[1.8]"><path d="M13 8H3M7 4 3 8l4 4" /></svg>
                    </button>
                    <ol className="flex flex-1 items-center gap-1.5">
                      {pages.map((_, i) => (
                        <li key={i} className="flex-1">
                          <button
                            type="button"
                            onClick={() => go(i)}
                            aria-current={i === at ? "step" : undefined}
                            aria-label={(labels.pageOf ?? "Part {n} of {total}").replace("{n}", String(i + 1)).replace("{total}", String(pages.length))}
                            className="group/bar block w-full py-2"
                          >
                            <span className="relative block h-[3px] overflow-hidden rounded-full bg-fg/12">
                              <span
                                className="bio-bar absolute inset-y-0 left-0 rounded-full bg-[var(--tone)]"
                                style={{ width: i < at ? "100%" : i === at ? "100%" : "0%", opacity: i < at ? 0.5 : 1 }}
                              />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ol>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-text-secondary" aria-hidden="true">
                      {at + 1}/{pages.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => go(at + 1)}
                      disabled={at === pages.length - 1}
                      aria-label={labels.nextPage ?? "Next"}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-fg/15 text-[var(--tone-ink)] transition-colors hover:border-[var(--tone)] disabled:opacity-35 disabled:hover:border-fg/15"
                    >
                      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current stroke-[1.8]"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                    </button>
                  </div>
                )}
              </section>
              <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-fg/[0.08] pt-4 md:hidden">
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
                  <ContactIcon kind="email" value={null} name={open.name} labels={labels} size="size-10" />
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
                  <ContactIcon kind="linkedin" value={null} name={open.name} org={open.org?.name ?? institutionOf(open.affiliation)} labels={labels} size="size-10" />
                )}
                <WebsiteIcon href={siteOf(open)} name={open.org?.name ?? company ?? open.name} label={labels.website} size="size-10" />
                {open.org && <OrgLogo org={open.org} className="ml-auto h-9" />}
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
