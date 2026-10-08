import type { Metadata } from "next";
import { editorHints } from "@/lib/env/hints";
import { notFound } from "next/navigation";
import type { PersonGroup } from "@prisma/client";
import { PeopleGrid } from "@/components/blocks/DataBlocks";
import { CtaBand, PageHero, Shell } from "@/components/flagship/Sections";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getPeople, mediaMap } from "@/lib/public/content";
import { buildMetadata } from "@/lib/public/seo";

/** Shared by /company/board, /company/management and /company/consultants. The Chairman's and MD's messages are on the About page. */
export function peoplePage(group: PersonGroup, path: string, titleKey: "board" | "management" | "consultants") {
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
      <>
        <PageHero eyebrow={t.companyEyebrow} title={t[titleKey]} />
        <Shell className="pb-16">
          {people.length ? (
            <PeopleGrid people={people} photos={photos} locale={locale as AppLocale} group={group} />
          ) : editorHints() ? (
            // Outside production: say where the profile is added.
            <a href="/admin/people/new" className="flex max-w-md flex-col gap-2 rounded-2xl border border-dashed border-gold/60 p-6 text-sm text-text-secondary hover:border-gold">
              <span className="font-semibold text-gold">No profile yet</span>
              Add one in Admin → People and choose the group “{group === "CONSULTANT" ? "Consultants" : group}”. It appears here once published.
            </a>
          ) : (
            <p className="text-text-secondary">{t.noItems}</p>
          )}
        </Shell>
        <CtaBand t={t} locale={locale} />
      </>
    );
  }

  return { generateMetadata, Page };
}
