import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand, PageHero, Shell } from "@/components/flagship/Sections";
import { FeaturedVideo, VideoGrid, type VideoItem } from "@/components/gallery/VideoGallery";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getAlbums, getVideos, type GalleryVideo } from "@/lib/public/insights";
import { buildMetadata } from "@/lib/public/seo";
import { formatDuration, formatEventDate } from "@/lib/public/text";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.galleryTitle, description: t.galleryBody, paths: { en: "gallery", bn: "gallery" } });
}

const toItem = (v: GalleryVideo, loc: AppLocale): VideoItem => ({
  id: v.id,
  title: v.title,
  description: v.description,
  provider: v.provider,
  embedUrl: v.embedUrl,
  file: v.file,
  poster: v.poster,
  dateLabel: formatEventDate(v.date, false, loc),
  durationLabel: formatDuration(v.durationSec, loc),
  event: v.event,
});

/**
 * The gallery: photo albums (Admin → Photo albums, plus every event with
 * photos) and videos (Admin → Videos, plus event videos).
 */
export default async function GalleryPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as AppLocale;
  const t = getMessages(loc);
  const [albums, videos] = await Promise.all([getAlbums(loc), getVideos(loc)]);
  const nf = new Intl.NumberFormat(loc === "bn" ? "bn-BD" : "en-US");
  const items = videos.map((v) => toItem(v, loc));
  const [lead, ...moreVideos] = items;
  const photoCount = albums.reduce((n, a) => n + a.photos.length, 0);
  const videoLabels = { play: t.playVideo, close: t.close, fromEvent: t.fromEvent, featured: t.featuredVideo };

  return (
    <>
      <PageHero eyebrow={t.insightsEyebrow} title={t.galleryTitle} body={t.galleryBody}>
        <nav aria-label={t.gallerySections} className="flex flex-wrap gap-2">
          {[
            { href: "#photos", label: t.photosTitle, n: albums.length, sub: t.photosCount.replace("{n}", nf.format(photoCount)) },
            { href: "#videos", label: t.videosTitle, n: videos.length, sub: t.videosCount.replace("{n}", nf.format(videos.length)) },
          ].map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="glass group flex items-center gap-3 rounded-full py-2 pr-5 pl-2 text-sm font-semibold transition-colors hover:border-brand-sky/60"
            >
              <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-brand-sky/15 px-2 font-mono text-xs text-cyan-200">{nf.format(s.n)}</span>
              <span className="flex flex-col leading-tight">
                {s.label}
                <span className="text-xs font-normal text-text-secondary">{s.sub}</span>
              </span>
            </a>
          ))}
        </nav>
      </PageHero>

      {lead && (
        <Shell className="pb-16">
          <FeaturedVideo v={lead} labels={videoLabels} />
        </Shell>
      )}

      <Shell id="photos" className="pb-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{t.photosTitle}</h2>
          {albums.length > 0 && <p className="font-mono text-xs text-text-secondary">{t.albumsCount.replace("{n}", nf.format(albums.length))}</p>}
        </div>
        {albums.length === 0 ? (
          <div data-reveal className="glass rounded-[2rem] p-8 text-center sm:p-10 md:p-14">
            <p className="font-display text-2xl font-semibold">{t.galleryEmptyTitle}</p>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">{t.galleryEmptyBody}</p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a, i) => {
              const others = a.photos.filter((p) => p.url !== a.cover?.url);
              const date = formatEventDate(a.date, a.approx, loc);
              return (
                <li key={a.id} data-reveal style={{ "--d": i % 3 } as CSSProperties}>
                  <Link href={a.href} className="spotlight glass group flex h-full flex-col overflow-hidden rounded-3xl transition-transform duration-500 hover:-translate-y-1">
                    <span className="relative grid aspect-[4/3] grid-cols-3 grid-rows-2 gap-1 overflow-hidden p-1">
                      <span className="relative col-span-2 row-span-2 overflow-hidden rounded-[1.1rem] bg-navy-800">
                        {a.cover && (
                          <Image src={a.cover.url} alt="" fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 32vw, 64vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                        )}
                      </span>
                      {[0, 1].map((k) => (
                        <span key={k} className="relative overflow-hidden rounded-[0.9rem] bg-navy-800">
                          {others[k] && <Image src={others[k]!.url} alt="" fill sizes="(min-width: 1024px) 11vw, (min-width: 640px) 16vw, 32vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.08]" />}
                        </span>
                      ))}
                      <span className="absolute right-3 bottom-3 rounded-full bg-[#05080f]/75 px-3 py-1 font-mono text-xs text-white backdrop-blur">
                        {t.photosCount.replace("{n}", nf.format(a.photos.length))}
                      </span>
                      <span className="absolute top-3 left-3 rounded-full bg-[#05080f]/75 px-3 py-1 text-[11px] font-semibold tracking-wide text-white uppercase backdrop-blur">
                        {a.kind === "event" ? t.eventAlbum : t.photoAlbum}
                      </span>
                    </span>
                    <span className="flex flex-col gap-1 p-5">
                      {date && <time className="font-mono text-xs text-cyan-300">{date}</time>}
                      <span className="font-display text-lg leading-snug font-semibold tracking-tight text-balance">{a.title}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Shell>

      <Shell id="videos" className="pb-16 md:pb-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{t.videosTitle}</h2>
          {videos.length > 0 && <p className="font-mono text-xs text-text-secondary">{t.videosCount.replace("{n}", nf.format(videos.length))}</p>}
        </div>
        {videos.length === 0 ? (
          <div data-reveal className="glass rounded-[2rem] p-8 text-center sm:p-10 md:p-14">
            <p className="font-display text-2xl font-semibold">{t.videosEmptyTitle}</p>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">{t.videosEmptyBody}</p>
          </div>
        ) : moreVideos.length > 0 ? (
          <VideoGrid videos={moreVideos} labels={videoLabels} />
        ) : (
          <p className="text-text-secondary">{t.videosOnlyFeatured}</p>
        )}
      </Shell>
      <CtaBand t={t} locale={loc} />
    </>
  );
}
