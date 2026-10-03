import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PeopleGrid } from "@/components/blocks/DataBlocks";
import { CtaBand, PageHero, SectionHeader, Shell } from "@/components/flagship/Sections";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getPeople, mediaMap } from "@/lib/public/content";
import { buildMetadata } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.teamTitle, description: t.teamBody, paths: { en: "company/team", bn: "company/team" } });
}

/**
 * The people who build and run Xpert's products: Admin → People, groups
 * "Leadership" and "Team". Each card opens a full profile. Until profiles are
 * published, the page points to management and the board instead of looking empty.
 */
export default async function TeamPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  const [leadership, team] = await Promise.all([getPeople("LEADERSHIP"), getPeople("TEAM")]);
  const photos = await mediaMap([...leadership, ...team].map((p) => p.photoMediaId), locale as AppLocale);
  const empty = leadership.length === 0 && team.length === 0;

  return (
    <>
      <PageHero eyebrow={t.companyEyebrow} title={t.teamTitle} body={t.teamBody} />

      {leadership.length > 0 && (
        <Shell className="pb-16 md:pb-24">
          <div className="flex flex-col gap-12">
            <SectionHeader title={t.leadershipTitle} />
            <PeopleGrid people={leadership} photos={photos} locale={locale as AppLocale} group="LEADERSHIP" />
          </div>
        </Shell>
      )}

      {team.length > 0 && (
        <Shell className="pb-16 md:pb-24">
          <div className="flex flex-col gap-12">
            {leadership.length > 0 && <SectionHeader title={t.teamMembersTitle} />}
            <PeopleGrid people={team} photos={photos} locale={locale as AppLocale} group="TEAM" />
          </div>
        </Shell>
      )}

      {empty && (
        <Shell className="pb-16 md:pb-24">
          <div data-reveal className="beam glass relative overflow-hidden rounded-[2rem] p-8 md:p-14">
            <div className="grid-fade pointer-events-none absolute inset-0 opacity-50" />
            <div className="relative flex max-w-2xl flex-col gap-6">
              <p className="eyebrow">{t.teamEmptyEyebrow}</p>
              <h2 className="font-display text-3xl leading-tight font-semibold tracking-[-0.02em] md:text-4xl">{t.teamEmptyTitle}</h2>
              <p className="text-lg leading-relaxed text-text-secondary">{t.teamEmptyBody}</p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/${locale}/company/management`} className="inline-flex h-11 items-center rounded-full border border-fg/15 px-5 text-sm font-semibold transition-colors hover:border-brand-sky/60">
                  {t.management} →
                </Link>
                <Link href={`/${locale}/company/board`} className="inline-flex h-11 items-center rounded-full border border-fg/15 px-5 text-sm font-semibold transition-colors hover:border-brand-sky/60">
                  {t.board} →
                </Link>
              </div>
            </div>
          </div>
        </Shell>
      )}

      <CtaBand t={t} locale={locale} />
    </>
  );
}
