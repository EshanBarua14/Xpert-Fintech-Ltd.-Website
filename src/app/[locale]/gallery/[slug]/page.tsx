import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand, PageHero, Shell } from "@/components/flagship/Sections";
import { Lightbox } from "@/components/gallery/Lightbox";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getAlbumBySlug, getAlbums } from "@/lib/public/insights";
import { buildMetadata } from "@/lib/public/seo";
import { formatEventDate } from "@/lib/public/text";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const data = await getAlbumBySlug(locale, slug);
  if (!data) return {};
  const slugOf = (l: string) => data.album.translations.find((x) => x.locale === l)?.slug;
  const en = slugOf("en");
  const bn = slugOf("bn");
  return buildMetadata({
    locale,
    title: data.tr.title,
    description: data.tr.description ?? getMessages(locale).galleryBody,
    paths: { ...(en && { en: `gallery/${en}` }), ...(bn && { bn: `gallery/${bn}` }) },
    ogImageId: data.album.coverMediaId ?? data.album.photos[0]?.mediaId ?? null,
  });
}

/** One photo album: every photo in a grid that opens a full-screen viewer. */
export default async function AlbumPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as AppLocale;
  const t = getMessages(loc);
  const data = await getAlbumBySlug(loc, slug);
  if (!data) notFound();
  const { album, tr, photos } = data;
  const nf = new Intl.NumberFormat(loc === "bn" ? "bn-BD" : "en-US");
  const date = formatEventDate(album.takenAt, false, loc);
  const more = (await getAlbums(loc)).filter((a) => a.id !== album.id).slice(0, 3);

  return (
    <>
      <PageHero eyebrow={t.galleryTitle} title={tr.title} body={tr.description}>
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-text-secondary">
          <Link href={`/${loc}/gallery`} className="rounded-full border border-fg/15 px-4 py-2 font-sans text-sm font-semibold text-text-primary hover:border-brand-sky/60">
            ← {t.backToGallery}
          </Link>
          {date && <time className="text-cyan-300">{date}</time>}
          <span>{t.photosCount.replace("{n}", nf.format(photos.length))}</span>
        </div>
      </PageHero>
      <Shell className="pb-20">
        <Lightbox photos={photos} labels={{ open: t.openPhoto, close: t.close, prev: t.prevPhoto, next: t.nextPhoto, counter: t.photoCounter }} />
      </Shell>
      {more.length > 0 && (
        <Shell className="pb-24">
          <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight">{t.moreAlbums}</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((a, i) => (
              <li key={a.id} data-reveal style={{ "--d": i } as CSSProperties}>
                <Link href={a.href} className="spotlight glass group flex h-full flex-col overflow-hidden rounded-3xl transition-transform duration-500 hover:-translate-y-1">
                  <span className="relative block aspect-[16/10] overflow-hidden bg-navy-800">
                    {a.cover && <Image src={a.cover.url} alt="" fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />}
                    <span className="absolute right-3 bottom-3 rounded-full bg-[#05080f]/75 px-3 py-1 font-mono text-xs text-white backdrop-blur">
                      {t.photosCount.replace("{n}", nf.format(a.photos.length))}
                    </span>
                  </span>
                  <span className="p-5 font-display text-lg leading-snug font-semibold tracking-tight text-balance">{a.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Shell>
      )}
      <CtaBand t={t} locale={loc} />
    </>
  );
}
