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
  bio: string | null;
  photo: { url: string; width: number | null; height: number | null } | null;
  linkedinUrl: string | null;
  email: string | null;
  /** Seeded stand-in until XFL sends the real profile. */
  isPlaceholder: boolean;
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
          {size === "lg" && <span className="font-mono text-[13px] font-medium">{p.email}</span>}
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

/** One profile card: portrait, name, role, a few lines of biography, and direct email and LinkedIn links. */
function PersonCard({
  p,
  labels,
  groupLabel,
  showPlaceholderBadge,
  featured,
  onOpen,
}: {
  p: GalleryPerson;
  labels: GalleryLabels;
  groupLabel: string;
  showPlaceholderBadge: boolean;
  featured: boolean;
  onOpen: (trigger: HTMLButtonElement) => void;
}) {
  const role = p.title ?? groupLabel;
  return (
    <article
      className={cn(
        "person-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-fg/[0.08] bg-navy-900 transition-[border-color,box-shadow,transform] duration-500 hover:border-brand-sky/35 hover:shadow-[0_28px_70px_-36px_rgb(6_17_31/0.9)]",
        featured && "lg:flex-row",
      )}
    >
      {/* The portrait also opens the profile; the name button below is the one in the tab order. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={(e) => onOpen(e.currentTarget)}
        className={cn("relative block aspect-[4/5] w-full overflow-hidden bg-navy-800", featured && "lg:aspect-auto lg:w-[46%] lg:shrink-0")}
      >
        <Image
          src={p.photo?.url ?? PLACEHOLDER_PHOTO}
          alt=""
          width={p.photo?.width ?? 480}
          height={p.photo?.height ?? 600}
          sizes={featured ? "(min-width: 1024px) 30vw, 100vw" : "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          className="person-photo h-full w-full object-cover"
          unoptimized={!p.photo}
        />
        <span aria-hidden="true" className="person-sheen pointer-events-none absolute inset-0" />
        {showPlaceholderBadge && p.isPlaceholder && (
          <span className="absolute top-3 left-3 rounded-md bg-[#06111f]/85 px-2 py-0.5 text-[11px] font-semibold text-[#e0b252]">{labels.placeholder}</span>
        )}
      </button>

      <div className={cn("flex flex-1 flex-col gap-3 p-5 sm:p-6", featured && "lg:justify-center lg:gap-4 lg:p-10")}>
        <div className="flex flex-col gap-1">
          <h3 className={cn("font-display leading-tight text-text-primary", featured ? "text-2xl lg:text-[2.25rem]" : "text-[1.375rem]")}>
            <button
              type="button"
              aria-haspopup="dialog"
              data-person={p.id}
              onClick={(e) => onOpen(e.currentTarget)}
              className="person-name text-left focus-visible:outline-offset-4"
            >
              {p.name}
            </button>
          </h3>
          <p className="text-sm font-medium text-brand-sky">{role}</p>
        </div>
        {p.bio && <p className={cn("text-sm leading-relaxed text-text-secondary", featured ? "line-clamp-5 lg:text-base" : "line-clamp-3")}>{p.bio}</p>}
        {(p.email || p.linkedinUrl) && (
          <div className="mt-auto flex items-center gap-3 border-t border-fg/[0.08] pt-4">
            {p.email && (
              <a
                href={`mailto:${p.email}`}
                aria-label={labels.email.replace("{name}", p.name)}
                className="flex min-w-0 items-center gap-2 text-sm text-text-secondary transition-colors hover:text-fg"
              >
                <SocialIcon kind="email" className="size-4 shrink-0 text-brand-sky" />
                <span className="truncate">{p.email}</span>
              </a>
            )}
            {p.linkedinUrl && (
              <a
                href={p.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${labels.linkedin}: ${p.name}`}
                title={labels.linkedin}
                className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full border border-fg/15 text-text-secondary transition-colors hover:border-[#0a66c2] hover:bg-[#0a66c2] hover:text-white"
              >
                <SocialIcon kind="linkedin" className="size-4" />
              </a>
            )}
          </div>
        )}
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
}: {
  people: GalleryPerson[];
  labels: GalleryLabels;
  /** True outside production, so editors can spot stand-ins. */
  showPlaceholderBadge: boolean;
  /** Shown as the role when a person has no title yet, e.g. "Management". */
  groupLabel: string;
  /** Board: the first person (the chair) gets a wide card. */
  featureFirst?: boolean;
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
    <>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {people.map((p, i) => {
          const featured = featureFirst && i === 0 && people.length > 2;
          return (
            <li key={p.id} data-reveal style={{ "--d": i % 4 } as CSSProperties} className={cn(featured && "sm:col-span-2")}>
              <PersonCard p={p} labels={labels} groupLabel={groupLabel} showPlaceholderBadge={showPlaceholderBadge} featured={featured} onOpen={(t) => show(p, t)} />
            </li>
          );
        })}
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
        className="person-dialog m-auto max-h-[calc(100dvh-2rem)] w-[min(60rem,calc(100vw-2rem))] overflow-auto rounded-[1.75rem] border border-fg/10 bg-navy-900 p-0 text-text-primary shadow-[0_60px_160px_-40px_rgb(0_0_0/0.8)] backdrop:bg-ink-950/75 backdrop:backdrop-blur-sm"
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
                <p className="eyebrow">{open.title ?? groupLabel}</p>
                <h2 id="person-dialog-name" className="font-display text-3xl leading-tight font-semibold tracking-[-0.02em] md:text-4xl">
                  {open.name}
                </h2>
                {showPlaceholderBadge && open.isPlaceholder && (
                  <span className="self-start rounded-md border border-gold/50 px-2 py-0.5 text-[11px] font-semibold text-gold">
                    {labels.placeholder}
                  </span>
                )}
              </div>
              <dl className="grid gap-1 border-l-2 border-gold/60 pl-5">
                <dt className="text-xs text-text-secondary">{labels.role}</dt>
                <dd className="text-text-primary">{open.title ?? groupLabel}</dd>
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
    </>
  );
}
