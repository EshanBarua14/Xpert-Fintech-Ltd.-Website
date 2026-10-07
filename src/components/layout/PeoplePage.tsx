import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { PersonGroup } from "@prisma/client";
import { PeopleGrid } from "@/components/blocks/DataBlocks";
import { CtaBand, PageHero, Shell } from "@/components/flagship/Sections";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getPeople, mediaMap } from "@/lib/public/content";
import { buildMetadata } from "@/lib/public/seo";
import { getLeaderMessage } from "@/lib/content/leaders";
import { LeaderMessage } from "@/components/people/LeaderMessage";

/** Shared by /company/board and /company/management (with the Chairman's or the MD's message, once published). */
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
    const leader = group === "BOARD" ? "chairman" : group === "MANAGEMENT" ? "md" : null;
    const [people, message] = await Promise.all([getPeople(group), leader ? getLeaderMessage(leader, locale as AppLocale) : null]);
    const photos = await mediaMap(people.map((p) => p.photoMediaId), locale as AppLocale);
    return (
      <>
        <PageHero eyebrow={t.companyEyebrow} title={t[titleKey]} />
        {message && (
          <Shell className="pb-20 md:pb-28">
            <LeaderMessage message={message} heading={message.key === "chairman" ? t.chairmanMessage : t.mdMessage} />
          </Shell>
        )}
        <Shell className="pb-16">
          {people.length ? <PeopleGrid people={people} photos={photos} locale={locale as AppLocale} group={group} /> : <p className="text-text-secondary">{t.noItems}</p>}
        </Shell>
        <CtaBand t={t} locale={locale} />
      </>
    );
  }

  return { generateMetadata, Page };
}
