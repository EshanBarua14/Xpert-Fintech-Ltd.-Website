import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Layout";
import { MediaImage, Paragraphs } from "@/components/blocks/Shared";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getEventBySlug, getSeo, mediaMap } from "@/lib/public/content";
import { breadcrumbLd, buildMetadata, JsonLd, SITE_URL } from "@/lib/public/seo";
import { formatEventDate, pick, videoEmbedUrl } from "@/lib/public/text";

type Props = { params: Promise<{ locale: string; slug: string }> };

async function load(locale: string, slug: string) {
  if (!isLocale(locale) || !/^[a-z0-9-]+$/.test(slug)) return null;
  const event = await getEventBySlug(locale, slug);
  return event ? { event, locale } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const found = await load(locale, slug);
  if (!found) return {};
  const tr = pick(found.event.translations, found.locale)!;
  const seo = await getSeo("EVENT", found.event.id, found.locale);
  const paths: Partial<Record<AppLocale, string>> = {};
  for (const t of found.event.translations) if (t.locale === "en" || t.locale === "bn") paths[t.locale] = `events/${t.slug}`;
  return buildMetadata({
    locale: found.locale,
    title: seo?.title ?? tr.title,
    description: seo?.description ?? tr.summary,
    paths,
    ogImageId: seo?.ogImageId ?? found.event.coverMediaId,
    type: "article",
  });
}

export default async function EventPage({ params }: Props) {
  const { locale, slug } = await params;
  const found = await load(locale, slug);
  if (!found) notFound();
  const { event } = found;
  const t = getMessages(found.locale);
  const tr = pick(event.translations, found.locale)!;
  const media = await mediaMap([event.coverMediaId], found.locale);
  const cover = media.get(event.coverMediaId ?? "");
  const date = formatEventDate(event.startsAt, event.dateIsApprox, found.locale);
  const video = videoEmbedUrl(event.videoUrl);
  const participants = event.organizations
    .filter((eo) => eo.organization.status === "PUBLISHED" && !eo.organization.deletedAt)
    .map((eo) => ({ id: eo.organizationId, name: pick(eo.organization.translations, found.locale)?.name }))
    .filter((p) => p.name);
  const url = `${SITE_URL}/${found.locale}/events/${tr.slug}`;

  return (
    <article>
      <JsonLd
        data={breadcrumbLd([
          { name: t.home, url: `${SITE_URL}/${found.locale}` },
          { name: t.events, url: `${SITE_URL}/${found.locale}/events` },
          { name: tr.title, url },
        ])}
      />
      {event.startsAt && !event.dateIsApprox && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Event",
            name: tr.title,
            description: tr.summary ?? undefined,
            startDate: event.startsAt.toISOString(),
            ...(event.endsAt && { endDate: event.endsAt.toISOString() }),
            ...(tr.location && { location: { "@type": "Place", name: tr.location, address: tr.location } }),
            organizer: { "@type": "Organization", name: "Xpert Fintech Ltd.", url: SITE_URL },
            url,
          }}
        />
      )}
      <Container className="flex max-w-4xl flex-col gap-8 py-16 md:py-24">
        <Link href={`/${found.locale}/events`} className="text-sm text-text-secondary hover:text-brand-sky">
          ← {t.allEvents}
        </Link>
        <header className="flex flex-col gap-4">
          {(date || tr.location) && (
            <p className="tabular text-sm text-brand-sky">
              {date}
              {date && tr.location ? " · " : ""}
              {tr.location}
            </p>
          )}
          <h1 className="font-display text-4xl font-semibold tracking-tight text-balance md:text-5xl">{tr.title}</h1>
          {tr.summary && <p className="text-xl text-text-secondary">{tr.summary}</p>}
        </header>
        {cover && <MediaImage media={cover} priority className="rounded-card border border-white/10" sizes="(min-width: 1024px) 896px, 100vw" />}
        <Paragraphs text={tr.body} className="text-lg" />
        {video && (
          <div className="aspect-video overflow-hidden rounded-card border border-white/10">
            <iframe src={video} title={`${tr.title} — ${t.video}`} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" className="h-full w-full" />
          </div>
        )}
        {participants.length > 0 && (
          <section className="flex flex-col gap-4 border-t border-white/10 pt-8">
            <h2 className="font-display text-xl font-semibold">{t.participants}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {participants.map((p) => (
                <li key={p.id} className="rounded-control border border-white/10 px-4 py-3 text-sm">
                  {p.name}
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </article>
  );
}
