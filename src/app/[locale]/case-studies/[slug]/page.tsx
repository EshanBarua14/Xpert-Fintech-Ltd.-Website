import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Paragraphs } from "@/components/blocks/Shared";
import { CtaBand, Shell } from "@/components/flagship/Sections";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getCaseStudyBySlug } from "@/lib/public/insights";
import { breadcrumbLd, buildMetadata, JsonLd, SITE_URL } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

async function load(locale: string, slug: string) {
  if (!isLocale(locale) || !/^[a-z0-9-]+$/.test(slug)) return null;
  const found = await getCaseStudyBySlug(locale as AppLocale, slug);
  return found ? { ...found, locale: locale as AppLocale } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const found = await load(locale, slug);
  if (!found) return {};
  const paths: Partial<Record<AppLocale, string>> = {};
  for (const t of found.caseStudy.translations) if (t.locale === "en" || t.locale === "bn") paths[t.locale] = `case-studies/${t.slug}`;
  return buildMetadata({ locale: found.locale, title: found.tr.title, description: found.tr.summary, paths, ogImageId: found.caseStudy.coverMediaId });
}

export default async function CaseStudyPage({ params }: Props) {
  const { locale, slug } = await params;
  const found = await load(locale, slug);
  if (!found) notFound();
  const { tr, cover } = found;
  const loc = found.locale;
  const t = getMessages(loc);
  const url = `${SITE_URL}/${loc}/case-studies/${tr.slug}`;
  const parts = [
    { n: "01", title: t.csChallenge, text: tr.challenge },
    { n: "02", title: t.csSolution, text: tr.solution },
    { n: "03", title: t.csOutcome, text: tr.outcome },
  ].filter((p) => p.text);

  return (
    <article>
      <JsonLd data={breadcrumbLd([{ name: t.home, url: `${SITE_URL}/${loc}` }, { name: t.caseStudiesTitle, url: `${SITE_URL}/${loc}/case-studies` }, { name: tr.title, url }])} />
      <header className="hero-seq relative -mt-20 overflow-hidden pt-20 md:-mt-24 md:pt-24">
        <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-10 pb-8 md:px-8 md:pt-14">
          <Link href={`/${loc}/case-studies`} data-reveal className="text-sm text-text-secondary hover:text-fg">
            ← {t.caseStudiesTitle}
          </Link>
          <h1 data-reveal className="font-display text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance md:text-6xl">{tr.title}</h1>
          {tr.summary && <p data-reveal className="text-xl leading-relaxed text-text-secondary">{tr.summary}</p>}
        </div>
      </header>
      {cover && (
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8">
          <div data-reveal className="glass relative aspect-[16/9] overflow-hidden rounded-[2rem]">
            <Image src={cover.url} alt={cover.alt || ""} fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
          </div>
        </div>
      )}
      <Shell className="py-12 md:py-16">
        <ol className="mx-auto flex max-w-4xl flex-col gap-6">
          {parts.map((p, i) => (
            <li key={p.n} data-reveal style={{ "--d": i } as CSSProperties} className="glass grid gap-4 rounded-3xl p-7 md:grid-cols-[8rem_1fr] md:p-10">
              <span className="flex flex-col gap-1">
                <span className="font-mono text-sm text-cyan-300">{p.n}</span>
                <span className="font-display text-xl font-semibold">{p.title}</span>
              </span>
              <Paragraphs text={p.text} className="text-lg" />
            </li>
          ))}
        </ol>
      </Shell>
      <CtaBand t={t} locale={loc} />
    </article>
  );
}
