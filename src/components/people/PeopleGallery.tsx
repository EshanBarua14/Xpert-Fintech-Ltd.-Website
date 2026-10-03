"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";

/**
 * Board and management profiles: photo cards that open a full profile in a
 * dialog (photo, role, biography, LinkedIn). Keyboard and screen-reader
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
  /** Seeded stand-in until XFL sends the real profile. */
  isPlaceholder: boolean;
};

export type GalleryLabels = {
  viewProfile: string;
  close: string;
  biography: string;
  bioPending: string;
  linkedin: string;
  placeholder: string;
  role: string;
};

const PLACEHOLDER_PHOTO = "/placeholders/person.svg";

export function PeopleGallery({
  people,
  labels,
  showPlaceholderBadge,
  groupLabel,
}: {
  people: GalleryPerson[];
  labels: GalleryLabels;
  /** True outside production, so editors can spot stand-ins. */
  showPlaceholderBadge: boolean;
  /** Shown as the role when a person has no title yet, e.g. "Management". */
  groupLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState<GalleryPerson | null>(null);

  const show = (p: GalleryPerson, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setOpen(p);
    // Open after the content has rendered so the dialog sizes itself correctly.
    requestAnimationFrame(() => dialogRef.current?.showModal());
  };
  const close = () => dialogRef.current?.close();

  if (!people.length) return null;

  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {people.map((p, i) => (
          <li key={p.id} data-reveal style={{ "--d": i % 4 } as CSSProperties}>
            <button
              type="button"
              aria-haspopup="dialog"
              data-person={p.id}
              onClick={(e) => show(p, e.currentTarget)}
              className="person-card spotlight glass group flex h-full w-full flex-col overflow-hidden rounded-3xl text-left transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-1.5 hover:border-brand-sky/40 hover:shadow-[0_30px_80px_-40px_rgb(34_188_235/0.7)] focus-visible:-translate-y-1.5"
            >
              <span className="relative block aspect-[4/5] overflow-hidden bg-navy-800">
                <Image
                  src={p.photo?.url ?? PLACEHOLDER_PHOTO}
                  alt=""
                  width={p.photo?.width ?? 480}
                  height={p.photo?.height ?? 600}
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="h-full w-full object-cover grayscale-[30%] transition-[transform,filter] duration-700 group-hover:scale-[1.06] group-hover:grayscale-0 group-focus-visible:scale-[1.06] group-focus-visible:grayscale-0"
                  unoptimized={!p.photo}
                />
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05080f]/95 via-[#05080f]/25 to-transparent" />
                <span aria-hidden="true" className="person-scan pointer-events-none absolute inset-x-0 -top-1/3 h-1/3 bg-gradient-to-b from-transparent via-brand-sky/25 to-transparent opacity-0" />
                {showPlaceholderBadge && p.isPlaceholder && (
                  <span className="absolute top-3 left-3 rounded-md border border-gold/50 bg-[#05080f]/80 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-[#e0b252] uppercase">
                    {labels.placeholder}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-6">
                  <span className="font-display text-xl leading-tight font-semibold tracking-tight text-white">{p.name}</span>
                  <span className="text-sm text-[#67e8f9]">{p.title ?? groupLabel}</span>
                  <span className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]">
                    <span className="overflow-hidden">
                      <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-white/90">
                        {labels.viewProfile} <span aria-hidden="true">→</span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </button>
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
                  <span className="self-start rounded-md border border-gold/50 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-gold uppercase">
                    {labels.placeholder}
                  </span>
                )}
              </div>
              <dl className="grid gap-1 border-l-2 border-gold/60 pl-5">
                <dt className="text-xs tracking-[0.14em] text-text-secondary uppercase">{labels.role}</dt>
                <dd className="text-text-primary">{open.title ?? groupLabel}</dd>
              </dl>
              <section className="flex flex-col gap-3">
                <h3 className="text-xs tracking-[0.14em] text-text-secondary uppercase">{labels.biography}</h3>
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
              {open.linkedinUrl && (
                <a
                  href={open.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex h-11 items-center gap-2 self-start rounded-full border border-fg/15 px-5 text-sm font-semibold text-brand-sky transition-colors hover:border-brand-sky/60"
                >
                  {labels.linkedin} <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
