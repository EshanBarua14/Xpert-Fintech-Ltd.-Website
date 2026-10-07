import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Paragraphs } from "@/components/blocks/Shared";
import { CtaBand, SectionHeader, Shell } from "@/components/flagship/Sections";
import { ArticleCard, formatNewsDate } from "@/components/insights/ArticleCard";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getArticleBySlug } from "@/lib/public/insights";
import { breadcrumbLd, buildMetadata, JsonLd, SITE_URL } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

async function load(locale: string, slug: string) {
  if (!isLocale(locale) || !/^[a-z0-9-]+$/.test(slug)) return null;
  const found = await getArticleBySlug(locale as AppLocale, slug);
  return found ? { ...found, locale: locale as AppLocale } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const found = await load(locale, slug);
  if (!found) return {};
  const paths: Partial<Record<AppLocale, string>> = {};
  for (const t of found.article.translations) if (t.locale === "en" || t.locale === "bn") paths[t.locale] = `news/${t.slug}`;
  return buildMetadata({
    locale: found.locale,
    title: found.tr.title,
    description: found.tr.excerpt ?? found.tr.subtitle,
    paths,
    ogImageId: found.article.coverMediaId,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const found = await load(locale, slug);
  if (!found) notFound();
  const { tr, card, tags, related } = found;
  const loc = found.locale;
  const t = getMessages(loc);
  const url = `${SITE_URL}/${loc}/news/${tr.slug}`;
  const share = [
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: "X", href: `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(tr.title)}` },
  ];

  return (
    <article>
      <JsonLd data={breadcrumbLd([{ name: t.home, url: `${SITE_URL}/${loc}` }, { name: t.newsTitle, url: `${SITE_URL}/${loc}/news` }, { name: tr.title, url }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: tr.title,
          description: tr.excerpt ?? undefined,
          datePublished: card.date.toISOString(),
          dateModified: found.article.updatedAt.toISOString(),
          ...(card.author && { author: { "@type": "Person", name: card.author } }),
          ...(card.cover && { image: `${SITE_URL}${card.cover.url}` }),
          publisher: { "@type": "Organization", name: "Xpert Fintech Ltd.", logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/xpert-logo.png` } },
          mainEntityOfPage: url,
          inLanguage: loc,
        }}
      />

      <header className="hero-seq relative -mt-20 overflow-hidden pt-20 md:-mt-24 md:pt-24">
        <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-16 pb-10 md:px-8 md:pt-24">
          <Link href={`/${loc}/news`} data-reveal className="text-sm text-text-secondary hover:text-fg">
            ← {t.allNews}
          </Link>
          <p data-reveal className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
            {card.category && <span className="font-semibold text-gold">{card.category}</span>}
            <time dateTime={card.date.toISOString()}>{formatNewsDate(card.date, loc)}</time>
            <span aria-hidden="true">·</span>
            <span>{t.minRead.replace("{n}", String(card.minutes))}</span>
          </p>
          <h1 data-reveal style={{ "--d": 1 } as CSSProperties} className="font-display text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-text-primary md:text-6xl">
            {tr.title}
          </h1>
          {tr.subtitle && (
            <p data-reveal style={{ "--d": 2 } as CSSProperties} className="text-xl leading-relaxed text-text-secondary md:text-2xl">
              {tr.subtitle}
            </p>
          )}
          {card.author && (
            <p data-reveal style={{ "--d": 3 } as CSSProperties} className="text-sm text-text-secondary">
              {t.byAuthor.replace("{name}", card.author)}
            </p>
          )}
        </div>
      </header>

      {card.cover && (
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8">
          <div data-reveal className="glass relative aspect-[16/9] overflow-hidden rounded-[2rem] p-2">
            <Image src={card.cover.url} alt={card.cover.alt || ""} fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="rounded-[1.6rem] object-cover p-2" />
          </div>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-5xl gap-12 px-4 py-14 md:px-8 lg:grid-cols-[1fr_12rem]">
        <div className="article-body max-w-3xl">
          <Paragraphs text={tr.body} className="text-lg leading-[1.8]" />
        </div>
        <aside className="flex flex-col gap-8 lg:sticky lg:top-[calc(8rem+var(--ticker-h))] lg:self-start">
          {tags.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-text-secondary">{t.tagsLabel}</p>
              <ul className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li key={tag} className="rounded-full border border-fg/10 px-3 py-1 text-xs text-text-secondary">
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-text-secondary">{t.shareLabel}</p>
            <ul className="flex flex-wrap gap-2 lg:flex-col">
              {share.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-full border border-fg/15 px-4 text-sm text-text-primary transition-colors hover:border-brand-sky/60">
                    {s.label} <span aria-hidden="true" className="ml-1">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <Shell className="border-t border-fg/[0.06] py-16 md:py-24">
          <div className="flex flex-col gap-10">
            <SectionHeader title={t.relatedNews} />
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a, i) => (
                <ArticleCard key={a.id} a={a} locale={loc} minLabel={t.minRead} i={i} />
              ))}
            </ul>
          </div>
        </Shell>
      )}
      <CtaBand t={t} locale={loc} />
    </article>
  );
}
