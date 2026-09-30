import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { PersonGroup } from "@prisma/client";
import { PeopleGrid } from "@/components/blocks/DataBlocks";
import { Container, SectionHeading } from "@/components/ui/Layout";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getPeople, mediaMap } from "@/lib/public/content";
import { buildMetadata } from "@/lib/public/seo";

/** Shared by /company/board and /company/management. */
export function peoplePage(group: PersonGroup, path: string, titleKey: "board" | "management") {
  async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    if (!isLocale(locale)) return {};
    return buildMetadata({ locale, title: getMessages(locale)[titleKey], paths: { en: path, bn: path } });
  }

  async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    if (!isLocale(locale)) notFound();
    const t = getMessages(locale);
    const people = await getPeople(group);
    const photos = await mediaMap(people.map((p) => p.photoMediaId), locale as AppLocale);
    return (
      <Container className="flex flex-col gap-12 py-16 md:py-24">
        <SectionHeading as="h1" title={t[titleKey]} />
        {people.length ? <PeopleGrid people={people} photos={photos} locale={locale} /> : <p className="text-text-secondary">{t.noItems}</p>}
      </Container>
    );
  }

  return { generateMetadata, Page };
}
