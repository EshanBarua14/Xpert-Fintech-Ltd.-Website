/**
 * Where a product's demo video and screens will go, shown only outside
 * production until they are added in Admin → Products → "Screens and demo
 * video". Same frame sizes as the real thing, so the page layout can be
 * reviewed before the media arrives.
 */
export function DemoPlaceholder({ adminHref, name }: { adminHref: string; name: string }) {
  return (
    <figure className="flex flex-col gap-4">
      <div className="demo-frame relative flex min-h-[15rem] aspect-video flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-dashed border-gold/50 bg-[#06111f] p-6 text-center">
        <span aria-hidden="true" className="demo-placeholder absolute inset-0 opacity-60" />
        <span aria-hidden="true" className="relative flex size-16 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white">
          <svg viewBox="0 0 12 12" className="ml-1 size-6 fill-current">
            <path d="M3 1.5v9l7.5-4.5z" />
          </svg>
        </span>
        <span className="relative flex flex-col gap-1.5">
          <span className="font-display text-xl text-white md:text-2xl">Demo video for {name}</span>
          <span className="text-sm text-white/70">Placeholder, only visible outside the live site. Add a YouTube/Vimeo link or upload an MP4.</span>
        </span>
        <a href={adminHref} className="relative inline-flex h-10 items-center rounded-full border border-gold/60 px-4 text-sm font-semibold text-[#e0b252] hover:bg-white/5">
          Add the demo video
        </a>
      </div>
    </figure>
  );
}

export function ScreensPlaceholder({ adminHref }: { adminHref: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-h-[16rem] min-w-0 items-center justify-center rounded-2xl border border-dashed border-gold/50 bg-fg/[0.03] p-6 text-center md:aspect-[16/10] md:min-h-0">
          <span className="flex flex-col items-center gap-3">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-9 fill-none stroke-text-secondary stroke-[1.5]">
              <rect x="3" y="4" width="18" height="14" rx="2" />
              <path d="M3 15l5-5 4 4 3-3 6 6" />
              <circle cx="15.5" cy="8.5" r="1.5" />
            </svg>
            <span className="font-display text-lg text-text-primary">Main product screen</span>
            <span className="max-w-sm text-sm text-text-secondary">Placeholder, only visible outside the live site.</span>
            <a href={adminHref} className="inline-flex h-10 items-center rounded-full border border-gold/60 px-4 text-sm font-semibold text-gold hover:bg-gold/10">
              Add screenshots
            </a>
          </span>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-4 md:grid-cols-1">
          {["Screen 2", "Screen 3"].map((l) => (
            <div key={l} className="flex aspect-[16/10] min-w-0 items-center justify-center rounded-2xl border border-dashed border-gold/40 bg-fg/[0.03] text-sm text-text-secondary">
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
