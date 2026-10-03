import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand, PageHero, Shell } from "@/components/flagship/Sections";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getAlbums } from "@/lib/public/insights";
import { buildMetadata } from "@/lib/public/seo";
import { formatEventDate } from "@/lib/public/text";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.galleryTitle, description: t.galleryBody, paths: { en: "gallery", bn: "gallery" } });
}

/** Photo albums: every published event with photos (Admin → Events & gallery). */
export default async function GalleryPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as AppLocale;
  const t = getMessages(loc);
  const albums = await getAlbums(loc);
  const nf = new Intl.NumberFormat(loc === "bn" ? "bn-BD" : "en-US");

  return (
    <>
      <PageHero eyebrow={t.insightsEyebrow} title={t.galleryTitle} body={t.galleryBody} />
      <Shell className="pb-24">
        {albums.length === 0 ? (
          <div data-reveal className="glass rounded-[2rem] p-10 text-center md:p-16">
            <p className="font-display text-2xl font-semibold">{t.galleryEmptyTitle}</p>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">{t.galleryEmptyBody}</p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a, i) => {
              const [cover, ...rest] = a.photos;
              const date = formatEventDate(a.date, a.approx, loc);
              return (
                <li key={a.id} data-reveal style={{ "--d": i % 3 } as CSSProperties}>
                  <Link href={a.href} className="spotlight glass group flex h-full flex-col overflow-hidden rounded-3xl transition-transform duration-500 hover:-translate-y-1">
                    <span className="relative grid aspect-[4/3] grid-cols-3 grid-rows-2 gap-1 overflow-hidden p-1">
                      <span className="relative col-span-2 row-span-2 overflow-hidden rounded-[1.1rem] bg-navy-800">
                        <Image src={cover!.url} alt="" fill sizes="(min-width: 1024px) 22vw, 60vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                      </span>
                      {[0, 1].map((k) => (
                        <span key={k} className="relative overflow-hidden rounded-[0.9rem] bg-navy-800">
                          {rest[k] && <Image src={rest[k]!.url} alt="" fill sizes="12vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.08]" />}
                        </span>
                      ))}
                      <span className="absolute right-3 bottom-3 rounded-full bg-[#05080f]/75 px-3 py-1 font-mono text-xs text-white backdrop-blur">
                        {t.photosCount.replace("{n}", nf.format(a.photos.length))}
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
      <CtaBand t={t} locale={loc} />
    </>
  );
}
