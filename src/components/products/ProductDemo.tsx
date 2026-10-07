"use client";

import { useState } from "react";

/**
 * A product's demo video. Shows a still with a play button and loads the
 * player only when asked (no third-party player until someone presses play).
 * Works with YouTube, Vimeo or Facebook links and with uploaded MP4/WebM files.
 */
export function ProductDemo({
  title,
  caption,
  poster,
  embedUrl,
  fileUrl,
  playLabel,
}: {
  title: string;
  caption?: string | null;
  poster?: string | null;
  embedUrl?: string | null;
  fileUrl?: string | null;
  playLabel: string;
}) {
  const [playing, setPlaying] = useState(false);
  const src = embedUrl ? `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1` : null;

  return (
    <figure className="flex flex-col gap-4">
      <div className="demo-frame relative aspect-video overflow-hidden rounded-2xl border border-fg/10 bg-[#06111f]">
        {playing ? (
          fileUrl ? (
            <video src={fileUrl} poster={poster ?? undefined} controls autoPlay playsInline className="h-full w-full bg-black object-contain">
              <track kind="captions" />
            </video>
          ) : (
            src && (
              <iframe
                src={src}
                title={title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                className="h-full w-full"
              />
            )
          )
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 flex items-center justify-center" aria-label={`${playLabel}: ${title}`}>
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            ) : (
              <span aria-hidden="true" className="demo-placeholder absolute inset-0" />
            )}
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#06111f]/70 via-transparent to-transparent" />
            <span className="relative flex items-center gap-3 rounded-full bg-white py-3 pr-6 pl-4 text-sm font-semibold text-[#0b1c31] shadow-[0_18px_50px_-12px_rgb(0_0_0/0.6)] transition-transform duration-300 group-hover:scale-105">
              <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-brand-royal text-white">
                <svg viewBox="0 0 12 12" className="ml-0.5 size-3.5 fill-current">
                  <path d="M3 1.5v9l7.5-4.5z" />
                </svg>
              </span>
              {playLabel}
            </span>
          </button>
        )}
      </div>
      {caption && <figcaption className="text-sm text-text-secondary">{caption}</figcaption>}
    </figure>
  );
}
