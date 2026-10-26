import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand, PageHero, Shell } from "@/components/flagship/Sections";
import { FeaturedVideo, VideoGrid, type VideoItem } from "@/components/gallery/VideoGallery";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getAlbums, getVideos, type Album, type GalleryVideo } from "@/lib/public/insights";
import { GalleryTabs } from "@/components/gallery/GalleryTabs";
import { GeneratedCover } from "@/components/media/GeneratedCover";
import { buildMetadata } from "@/lib/public/seo";
import { formatDuration, formatEventDate } from "@/lib/public/text";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.seoGalleryTitle, description: t.galleryBody, paths: { en: "gallery", bn: "gallery" } });
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

/** One album: a photo mosaic (or its videos' pictures), with how many photos and videos it holds. */
function AlbumCard({ a, i, loc, t, nf }: { a: Album; i: number; loc: AppLocale; t: ReturnType<typeof getMessages>; nf: Intl.NumberFormat }) {
  // Photos first, then the videos' pictures, for the mosaic.
  const tiles = [...(a.cover ? [a.cover.url] : []), ...a.photos.filter((p) => p.url !== a.cover?.url).map((p) => p.url), ...a.videos.map((v) => v.poster).filter((x): x is string => Boolean(x))];
  const date = formatEventDate(a.date, a.approx, loc);
  const kind = a.photos.length && a.videos.length ? t.mixedAlbum : a.videos.length ? t.videoAlbum : a.kind === "event" ? t.eventAlbum : t.photoAlbum;
  return (
    <li data-reveal style={{ "--d": i % 3 } as CSSProperties}>
      <Link href={a.href} className="spotlight glass group flex h-full flex-col overflow-hidden rounded-3xl transition-transform duration-500 hover:-translate-y-1">
        <span className="relative grid aspect-[4/3] grid-cols-3 grid-rows-2 gap-1 overflow-hidden p-1">
          <span className="relative col-span-2 row-span-2 overflow-hidden rounded-[1.1rem] bg-navy-800">
            {tiles[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              tiles[0].startsWith("https://") ? <img src={tiles[0]} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" /> : <Image src={tiles[0]} alt="" fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 32vw, 64vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
            ) : (
              <GeneratedCover seed={a.id} />
            )}
          </span>
          {[1, 2].map((k) => (
            <span key={k} className="relative overflow-hidden rounded-[0.9rem] bg-navy-800">
              {tiles[k] &&
                (tiles[k]!.startsWith("https://") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tiles[k]} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <Image src={tiles[k]!} alt="" fill sizes="(min-width: 1024px) 11vw, (min-width: 640px) 16vw, 32vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.08]" />
                ))}
            </span>
          ))}
          <span className="absolute right-3 bottom-3 flex gap-1.5">
            {a.photos.length > 0 && <span className="rounded-full bg-[#05080f]/75 px-3 py-1 font-mono text-xs text-white backdrop-blur">{t.photosCount.replace("{n}", nf.format(a.photos.length))}</span>}
            {a.videos.length > 0 && <span className="rounded-full bg-[#05080f]/75 px-3 py-1 font-mono text-xs text-white backdrop-blur">{t.videosCount.replace("{n}", nf.format(a.videos.length))}</span>}
          </span>
          <span className="absolute top-3 left-3 rounded-full bg-[#05080f]/75 px-3 py-1 text-[max(11px,0.6875rem)] font-semibold text-white backdrop-blur">{kind}</span>
        </span>
        <span className="flex flex-col gap-1 p-5">
          {date && <time className="font-mono text-xs text-cyan-300">{date}</time>}
          <span className="font-display text-lg leading-snug font-semibold tracking-tight text-balance">{a.title}</span>
        </span>
      </Link>
    </li>
  );
}

/**
 * The gallery: albums (Admin → Albums, which hold photos, videos or both,
 * plus every event with photos or videos) and videos, under All / Photos /
 * Videos tabs.
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
  const photoAlbums = albums.filter((a) => a.photos.length > 0);
  const videoAlbums = albums.filter((a) => a.videos.length > 0);
  const photoCount = albums.reduce((n, a) => n + a.photos.length, 0);
  const videoLabels = { play: t.playVideo, close: t.close, fromEvent: t.fromEvent, featured: t.featuredVideo };

  const albumGrid = (list: Album[], heading: string) =>
    list.length > 0 && (
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{heading}</h2>
          <p className="font-mono text-xs text-text-secondary">{t.albumsCount.replace("{n}", nf.format(list.length))}</p>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a, i) => (
            <AlbumCard key={a.id} a={a} i={i} loc={loc} t={t} nf={nf} />
          ))}
        </ul>
      </section>
    );
  const empty = (title: string, body: string) => (
    <div data-reveal className="glass rounded-[2rem] p-8 text-center sm:p-10 md:p-14">
      <p className="font-display text-2xl font-semibold">{title}</p>
      <p className="mx-auto mt-3 max-w-xl text-text-secondary">{body}</p>
    </div>
  );
  const videoSection = (withLead: boolean) =>
    items.length > 0 && (
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{t.videosTitle}</h2>
          <p className="font-mono text-xs text-text-secondary">{t.videosCount.replace("{n}", nf.format(items.length))}</p>
        </div>
        {withLead && lead && <FeaturedVideo v={lead} labels={videoLabels} />}
        {(withLead ? moreVideos : items).length > 0 && <VideoGrid videos={withLead ? moreVideos : items} labels={videoLabels} />}
      </section>
    );

  return (
    <>
      <PageHero crumb={{ locale, path: "gallery", name: t.galleryTitle, home: t.home }} eyebrow={t.insightsEyebrow} title={t.galleryHero} body={t.galleryBody} />
      <Shell className="pb-14 md:pb-16">
        {albums.length === 0 && items.length === 0 ? (
          empty(t.galleryEmptyTitle, t.galleryEmptyBody)
        ) : (
          <GalleryTabs
            label={t.gallerySections}
            tabs={[
              {
                id: "all",
                label: t.galleryAll,
                count: nf.format(albums.length + items.length),
                content: (
                  <div className="flex flex-col gap-14">
                    {albumGrid(albums, t.albumsTitle)}
                    {videoSection(true)}
                  </div>
                ),
              },
              {
                id: "photos",
                label: t.photosTitle,
                count: nf.format(photoCount),
                content: photoAlbums.length ? albumGrid(photoAlbums, t.photosTitle) : empty(t.galleryEmptyTitle, t.galleryEmptyBody),
              },
              {
                id: "videos",
                label: t.videosTitle,
                count: nf.format(items.length),
                content:
                  items.length || videoAlbums.length ? (
                    <div className="flex flex-col gap-14">
                      {albumGrid(videoAlbums, t.videoAlbumsTitle)}
                      {videoSection(false)}
                    </div>
                  ) : (
                    empty(t.videosEmptyTitle, t.videosEmptyBody)
                  ),
              },
            ]}
          />
        )}
      </Shell>
      <CtaBand t={t} locale={loc} />
    </>
  );
}
