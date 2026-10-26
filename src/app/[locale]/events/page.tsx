import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventTimeline } from "@/components/insights/EventTimeline";
import { CtaBand, PageHero, Shell } from "@/components/flagship/Sections";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getEventTimeline } from "@/lib/public/insights";
import { buildMetadata } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, title: getMessages(locale).seoEventsTitle, description: getMessages(locale).eventsHeroBody, paths: { en: "events", bn: "events" } });
}

export default async function EventsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  const events = await getEventTimeline(locale);
  return (
    <>
      <PageHero crumb={{ locale, path: "events", name: t.events, home: t.home }} eyebrow={t.latestEyebrow} title={t.eventsHero} body={t.eventsHeroBody} />
      <Shell className="pb-12">
        {events.length ? <EventTimeline events={events} locale={locale} labels={{ photos: t.eventsPhotos, with: t.eventsWith, open: t.eventsOpen }} /> : <p className="text-text-secondary">{t.noItems}</p>}
      </Shell>
      <CtaBand t={t} locale={locale} />
    </>
  );
}
