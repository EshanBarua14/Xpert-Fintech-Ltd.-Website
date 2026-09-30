import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventCards } from "@/components/blocks/DataBlocks";
import { Container, SectionHeading } from "@/components/ui/Layout";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getEvents } from "@/lib/public/content";
import { buildMetadata } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, title: getMessages(locale).events, paths: { en: "events", bn: "events" } });
}

export default async function EventsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  const events = await getEvents();
  return (
    <Container className="flex flex-col gap-12 py-16 md:py-24">
      <SectionHeading as="h1" title={t.events} />
      {events.length ? <EventCards events={events} locale={locale} /> : <p className="text-text-secondary">{t.noItems}</p>}
    </Container>
  );
}
