import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CtaBand, PageHero, Shell } from "@/components/flagship/Sections";
import { Icon } from "@/components/ui/Icon";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages, type Messages } from "@/lib/i18n/messages";
import { getResources } from "@/lib/public/insights";
import { buildMetadata } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.resourcesTitle, description: t.resourcesBody, paths: { en: "resources", bn: "resources" } });
}

const kindLabel = (t: Messages, k: string) =>
  ({ BROCHURE: t.resBrochure, PRODUCT_SHEET: t.resProductSheet, WHITEPAPER: t.resWhitepaper, TECHNICAL_DOCUMENT: t.resTechnical, PRESENTATION: t.resPresentation, VIDEO: t.resVideo, OTHER: t.resOther } as Record<string, string>)[k] ?? k;

/** Downloads from Admin → Resources: brochures, product sheets, documents and links. */
export default async function ResourcesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as AppLocale;
  const t = getMessages(loc);
  const items = await getResources(loc);

  return (
    <>
      <PageHero eyebrow={t.insightsEyebrow} title={t.resourcesTitle} body={t.resourcesBody} />
      <Shell className="pb-24">
        {items.length === 0 ? (
          <div data-reveal className="glass rounded-[2rem] p-10 text-center md:p-16">
            <p className="font-display text-2xl font-semibold">{t.resourcesEmptyTitle}</p>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">{t.resourcesEmptyBody}</p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r, i) => (
              <li key={r.id} data-reveal style={{ "--d": i % 3 } as CSSProperties}>
                <a href={r.href!} target="_blank" rel="noopener noreferrer" className="spotlight glass group flex h-full flex-col overflow-hidden rounded-3xl transition-transform duration-500 hover:-translate-y-1">
                  <span className="relative block aspect-[16/10] overflow-hidden bg-navy-800">
                    {r.cover ? (
                      <Image src={r.cover.url} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                    ) : (
                      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-royal/30 via-navy-800 to-ink-950">
                        <span className="grid-fade pointer-events-none absolute inset-0 opacity-50" />
                        <Icon name="document" className="relative size-16 text-cyan-300/70" />
                      </span>
                    )}
                  </span>
                  <span className="flex flex-1 flex-col gap-3 p-6">
                    <span className="text-xs font-semibold text-gold">{kindLabel(t, r.kind)}</span>
                    <span className="font-display text-xl leading-snug font-semibold tracking-tight">{r.title}</span>
                    {r.summary && <span className="line-clamp-3 text-sm text-text-secondary">{r.summary}</span>}
                    <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-brand-sky">
                      {r.external ? t.openLink : t.downloadPdf}
                      {r.sizeKb && <span className="font-normal text-text-secondary">· {r.sizeKb} KB</span>}
                      <span aria-hidden="true">{r.external ? "↗" : "↓"}</span>
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Shell>
      <CtaBand t={t} locale={loc} />
    </>
  );
}
