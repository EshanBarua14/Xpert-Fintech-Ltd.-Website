"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/** A video ready to show: dates and lengths are formatted on the server. */
export type VideoItem = {
  id: string;
  title: string;
  description: string | null;
  provider: "UPLOAD" | "YOUTUBE" | "VIMEO" | "FACEBOOK";
  embedUrl: string | null;
  file: { url: string; type: string } | null;
  poster: string | null;
  dateLabel: string | null;
  durationLabel: string | null;
  event: { title: string; href: string } | null;
};

export type VideoLabels = { play: string; close: string; fromEvent: string; featured: string };

const PROVIDER = { UPLOAD: "XFL", YOUTUBE: "YouTube", VIMEO: "Vimeo", FACEBOOK: "Facebook" } as const;

/** Adds autoplay to a provider's embed address, so one click starts playback. */
function autoplay(url: string) {
  return url + (url.includes("?") ? "&" : "?") + "autoplay=1";
}

/** The player itself: an iframe for linked videos, a <video> for uploads. */
function Player({ v, title }: { v: VideoItem; title: string }) {
  if (v.file) {
    return (
      <video controls autoPlay playsInline poster={v.poster ?? undefined} className="h-full w-full bg-black object-contain">
        <source src={v.file.url} type={v.file.type} />
      </video>
    );
  }
  if (!v.embedUrl) return null;
  return (
    <iframe
      src={autoplay(v.embedUrl)}
      title={title}
      className="h-full w-full"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

function Poster({ v, priority = false }: { v: VideoItem; priority?: boolean }) {
  // If the provider's thumbnail cannot load (blocked, removed), show the branded panel instead.
  const [failed, setFailed] = useState(false);
  return v.poster && !failed ? (
    // eslint-disable-next-line @next/next/no-img-element -- remote provider thumbnails (YouTube) are not optimised by next/image
    <img
      src={v.poster}
      alt=""
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
    />
  ) : (
    <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_10%,rgb(56_189_248/0.35),transparent_60%),radial-gradient(90%_80%_at_90%_100%,rgb(37_99_235/0.45),transparent_60%)] bg-navy-800">
      <span className="absolute bottom-4 left-4 font-mono text-[11px] text-white/70">XFL · {PROVIDER[v.provider]}</span>
    </span>
  );
}

function PlayBadge({ big = false }: { big?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-navy-900 shadow-[0_10px_40px_rgb(0_0_0/0.45)] ring-8 ring-white/15 transition-transform duration-300 group-hover:scale-110 " +
        (big ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-14 sm:w-14")
      }
    >
      <svg viewBox="0 0 24 24" className={big ? "ml-1 h-7 w-7 sm:h-8 sm:w-8" : "ml-0.5 h-5 w-5 sm:h-6 sm:w-6"} fill="currentColor">
        <path d="M8 5.5v13a1 1 0 001.53.85l10.4-6.5a1 1 0 000-1.7L9.53 4.65A1 1 0 008 5.5z" />
      </svg>
    </span>
  );
}

function Meta({ v, labels }: { v: VideoItem; labels: VideoLabels }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-text-secondary">
      {v.dateLabel && <span className="text-cyan-300">{v.dateLabel}</span>}
      <span>{PROVIDER[v.provider]}</span>
      {v.event && (
        <span className="truncate">
          {labels.fromEvent}: {v.event.title}
        </span>
      )}
    </span>
  );
}

/**
 * The lead video, played in place: the poster turns into the player on click,
 * so nothing loads from YouTube/Vimeo/Facebook until a visitor asks for it.
 */
export function FeaturedVideo({ v, labels }: { v: VideoItem; labels: VideoLabels }) {
  const [playing, setPlaying] = useState(false);
  return (
    <article id={`video-${v.id}`} className="glass grid scroll-mt-32 overflow-hidden rounded-[2rem] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="relative aspect-video bg-black">
        {playing ? (
          <Player v={v} title={v.title} />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 overflow-hidden" aria-label={`${labels.play}: ${v.title}`}>
            <Poster v={v} priority />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#05080f]/70 via-transparent to-transparent" />
            <PlayBadge big />
            {v.durationLabel && (
              <span className="absolute right-4 bottom-4 rounded-full bg-[#05080f]/80 px-3 py-1 font-mono text-xs text-white backdrop-blur">{v.durationLabel}</span>
            )}
          </button>
        )}
      </div>
      <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
        <span className="w-fit rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 font-mono text-[11px] text-accent">
          {labels.featured}
        </span>
        <h3 className="font-display text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">{v.title}</h3>
        {v.description && <p className="text-text-secondary">{v.description}</p>}
        <Meta v={v} labels={labels} />
        {v.event && (
          <a href={v.event.href} className="w-fit text-sm font-semibold text-brand-sky hover:underline">
            {v.event.title}
          </a>
        )}
      </div>
    </article>
  );
}

/**
 * Video cards that open a player in a dialog. The player is removed when the
 * dialog closes, so playback always stops; focus returns to the card.
 */
export function VideoGrid({ videos, labels }: { videos: VideoItem[]; labels: VideoLabels }) {
  const [active, setActive] = useState<VideoItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => {
      setActive(null);
      opener.current?.focus();
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  const open = (v: VideoItem, el: HTMLButtonElement) => {
    opener.current = el;
    setActive(v);
    requestAnimationFrame(() => dialogRef.current?.showModal());
  };

  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v, i) => (
          <li key={v.id} id={`video-${v.id}`} data-reveal style={{ "--d": i % 3 } as CSSProperties} className="scroll-mt-32">
            <button
              type="button"
              onClick={(e) => open(v, e.currentTarget)}
              aria-label={`${labels.play}: ${v.title}`}
              className="spotlight glass group flex h-full w-full flex-col overflow-hidden rounded-3xl text-left transition-transform duration-500 hover:-translate-y-1"
            >
              <span className="relative block aspect-video overflow-hidden bg-navy-800">
                <Poster v={v} />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#05080f]/60 to-transparent" />
                <PlayBadge />
                {v.durationLabel && (
                  <span className="absolute right-3 bottom-3 rounded-full bg-[#05080f]/80 px-2.5 py-0.5 font-mono text-xs text-white backdrop-blur">{v.durationLabel}</span>
                )}
              </span>
              <span className="flex flex-1 flex-col gap-2 p-5">
                <span className="font-display text-lg leading-snug font-semibold tracking-tight text-balance">{v.title}</span>
                <Meta v={v} labels={labels} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={active?.title ?? labels.play}
        className="m-auto w-[min(72rem,calc(100vw-1.5rem))] max-w-none overflow-visible bg-transparent p-0 text-text-primary backdrop:bg-[#02040a]/90 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          // A click on the backdrop (outside the content) closes the dialog.
          if (e.target === e.currentTarget) dialogRef.current?.close();
        }}
      >
        {active && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-display text-lg leading-snug font-semibold text-white sm:text-xl">{active.title}</h3>
                <div className="mt-1">
                  <Meta v={active} labels={labels} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
                aria-label={labels.close}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="relative aspect-video max-h-[75dvh] w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
              <Player v={active} title={active.title} />
            </div>
            {active.description && <p className="max-w-3xl text-sm text-white/75">{active.description}</p>}
          </div>
        )}
      </dialog>
    </>
  );
}
