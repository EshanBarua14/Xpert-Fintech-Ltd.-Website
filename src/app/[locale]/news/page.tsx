import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCards } from "@/components/blocks/DataBlocks";
import { CtaBand, PageHero, Shell } from "@/components/flagship/Sections";
import { ArticleCard, FeaturedArticle } from "@/components/insights/ArticleCard";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getEvents } from "@/lib/public/content";
import { getArticleCards, getNewsCategories } from "@/lib/public/insights";
import { buildMetadata } from "@/lib/public/seo";
import { cn } from "@/lib/utils/cn";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ category?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.newsTitle, description: t.newsBody, paths: { en: "news", bn: "news" } });
}

/** News and announcements from Admin → News, filterable by category. */
export default async function NewsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as AppLocale;
  const t = getMessages(loc);
  const { category } = await searchParams;
  const slug = typeof category === "string" && /^[a-z0-9-]{1,80}$/.test(category) ? category : null;
  const [cards, categories] = await Promise.all([getArticleCards(loc, slug), getNewsCategories(loc)]);
  // No stories yet: show the latest milestones so the page is never empty.
  const events = cards.length === 0 ? await getEvents(3) : [];
  // With a category filter, every story is a card; otherwise the newest leads.
  const lead = slug ? undefined : cards[0];
  const rest = slug ? cards : cards.slice(1);

  return (
    <>
      <PageHero eyebrow={t.insightsEyebrow} title={t.newsTitle} body={t.newsBody} />
      <Shell className="pb-24">
        <div className="flex flex-col gap-12">
          {categories.length > 0 && (
            <nav aria-label={t.newsCategories} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {[{ slug: null as string | null, name: t.allNews }, ...categories].map((c) => {
                const active = c.slug === slug;
                return (
                  <Link
                    key={c.slug ?? "all"}
                    href={c.slug ? `/${loc}/news?category=${c.slug}` : `/${loc}/news`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                      active ? "border-brand-sky/60 bg-brand-sky/10 text-text-primary" : "border-fg/10 text-text-secondary hover:border-fg/25 hover:text-text-primary",
                    )}
                  >
                    {c.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {cards.length === 0 ? (
            <div className="flex flex-col gap-10">
              <div data-reveal className="glass rounded-[2rem] p-8 text-center sm:p-10 md:p-16">
                <p className="font-display text-2xl font-semibold">{t.newsEmptyTitle}</p>
                <p className="mx-auto mt-3 max-w-xl text-text-secondary">{t.newsEmptyBody}</p>
                <Link href={`/${loc}/events`} className="mt-6 inline-flex h-11 items-center rounded-full border border-fg/15 px-5 text-sm font-semibold hover:border-brand-sky/60">
                  {t.allEvents}
                </Link>
              </div>
              {events.length > 0 && (
                <section aria-labelledby="latest-milestones" className="flex flex-col gap-5">
                  <h2 id="latest-milestones" className="font-display text-2xl font-semibold tracking-tight">
                    {t.latestMilestones}
                  </h2>
                  <EventCards events={events} locale={loc} />
                </section>
              )}
            </div>
          ) : (
            <>
              {lead && <FeaturedArticle a={lead} locale={loc} minLabel={t.minRead} readLabel={t.readArticle} />}
              {rest.length > 0 && (
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((a, i) => (
                    <ArticleCard key={a.id} a={a} locale={loc} minLabel={t.minRead} i={i} />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </Shell>
      <CtaBand t={t} locale={loc} />
    </>
  );
}
