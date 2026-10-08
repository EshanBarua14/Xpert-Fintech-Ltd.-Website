import { cn } from "@/lib/utils/cn";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeaderMessage } from "@/components/people/LeaderMessage";
import { getLeaderMessage } from "@/lib/content/leaders";
import { Sections } from "@/components/blocks/BlockRenderer";
import { CtaBand, PageHero, SectionHeader, Shell } from "@/components/flagship/Sections";
import { LogoMarquee } from "@/components/organizations/LogoWall";
import { Icon } from "@/components/ui/Icon";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { mediaIdsOf, toSections } from "@/lib/public/blocks";
import { getCompanyStory, getMilestones, getPeopleCounts } from "@/lib/public/company";
import { getPageByPath, getSeo } from "@/lib/public/content";
import { getFlagshipData } from "@/lib/public/flagship";
import { blockContext, buildMetadata } from "@/lib/public/seo";
import { formatEventDate, pick } from "@/lib/public/text";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  const [page, story] = await Promise.all([getPageByPath(locale, "company/about"), getCompanyStory(locale)]);
  const seo = page ? await getSeo("PAGE", page.id, locale) : null;
  return buildMetadata({
    locale,
    title: seo?.title ?? t.aboutTitle,
    description: seo?.description ?? story.summary,
    paths: { en: "company/about", bn: "company/about" },
    ogImageId: seo?.ogImageId,
  });
}

/**
 * Who Xpert is: the story, mission and vision from Admin → Settings, the
 * milestones from published events, the consortium, and the people. Sections
 * an editor adds to the "About" page in Admin → Pages (e.g. core values)
 * appear at the end.
 */
export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as AppLocale;
  const t = getMessages(loc);
  const [story, milestones, counts, flagship, page] = await Promise.all([
    getCompanyStory(loc),
    getMilestones(loc),
    getPeopleCounts(),
    getFlagshipData(loc),
    getPageByPath(loc, "company/about"),
  ]);
  const [chairman, md] = await Promise.all([getLeaderMessage("chairman", loc), getLeaderMessage("md", loc)]);
  const sections = page ? toSections(page, loc) : [];
  const ctx = sections.length ? await blockContext(loc, mediaIdsOf(sections)) : null;
  const tr = page ? pick(page.translations, loc) : undefined;
  const nf = new Intl.NumberFormat(loc === "bn" ? "bn-BD" : "en-US");

  const people = [
    { href: "company/board", title: t.board, body: t.boardLinkBody, count: counts.BOARD, icon: "shield" },
    { href: "company/management", title: t.management, body: t.managementLinkBody, count: counts.MANAGEMENT, icon: "users" },
    // Shown once a consultant is published in Admin → People.
    ...(counts.CONSULTANT > 0 ? [{ href: "company/consultants", title: t.consultants, body: t.consultantsLinkBody, count: counts.CONSULTANT, icon: "users" }] : []),
    { href: "company/team", title: t.teamTitle, body: t.teamLinkBody, count: counts.LEADERSHIP + counts.TEAM, icon: "network" },
  ];

  return (
    <div>
      <PageHero eyebrow={t.companyEyebrow} title={tr?.title ?? t.aboutTitle} body={story.summary} />

      {/* Story, mission, vision: the story as reading text on the left, mission and vision as two statements on the right, top-aligned. */}
      {(story.about || story.mission || story.vision) && (
        <Shell className="about-justify pb-14 md:pb-16">
          <div className="grid gap-12 border-t border-fg/10 pt-12 md:pt-16 lg:grid-cols-12 lg:gap-16">
            {story.about && (
              <div data-reveal className={cn("flex flex-col gap-6", story.mission || story.vision ? "lg:col-span-6" : "lg:col-span-9")}>
                <h2 className="font-display text-3xl leading-tight tracking-[-0.015em] text-text-primary md:text-4xl">{t.ourStory}</h2>
                <div className="flex max-w-[62ch] flex-col gap-5">
                  {story.about
                    .split(/\n{2,}/)
                    .map((para) => para.trim())
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i} className={cn("leading-relaxed", i === 0 ? "text-lg text-text-primary md:text-xl" : "text-base text-text-secondary md:text-lg")}>
                        {para}
                      </p>
                    ))}
                </div>
              </div>
            )}
            {(story.mission || story.vision) && (
              <dl className={cn("flex flex-col divide-y divide-fg/10", story.about ? "lg:col-span-6" : "lg:col-span-12 lg:flex-row lg:divide-x lg:divide-y-0")}>
                {[
                  { label: t.mission, text: story.mission, dot: "bg-gold" },
                  { label: t.vision, text: story.vision, dot: "bg-brand-sky" },
                ]
                  .filter((x) => x.text)
                  .map((x, i) => (
                    <div key={x.label} data-reveal style={{ "--d": i + 1 } as CSSProperties} className="flex flex-col gap-3 py-8 first:pt-0 last:pb-0 lg:first:pt-1">
                      <dt className="flex items-center gap-2.5 text-sm font-semibold text-text-secondary">
                        <span aria-hidden="true" className={cn("size-2 rounded-full", x.dot)} />
                        {x.label}
                      </dt>
                      <dd className="font-display text-lg leading-snug text-text-primary md:text-xl">{x.text}</dd>
                    </div>
                  ))}
              </dl>
            )}
          </div>
        </Shell>
      )}

      {/* Chairman's and MD's messages (Admin → Messages, once published) */}
      {(chairman || md) && (
        <Shell className="about-justify pb-14 md:pb-16">
          <div className="flex flex-col gap-20 md:gap-28">
            {chairman && <LeaderMessage message={chairman} heading={t.chairmanMessage} compact />}
            {md && <LeaderMessage message={md} heading={t.mdMessage} compact />}
          </div>
        </Shell>
      )}

      {/* The consortium, as a moving strip */}
      {flagship.members.length > 0 && (
        <div className="pb-14 md:pb-16">
          <Shell className="pb-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHeader eyebrow={t.consortiumEyebrow} title={t.ownedByTitle.replace("{n}", nf.format(flagship.members.length))} />
              <Link href={`/${loc}/consortium`} className="text-sm font-semibold text-brand-sky hover:text-fg">
                {t.meetConsortium}
              </Link>
            </div>
          </Shell>
          <LogoMarquee members={flagship.members} label={t.members} />
        </div>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <Shell className="pb-14 md:pb-16">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="lg:sticky lg:top-[calc(8rem+var(--ticker-h))] lg:self-start">
              <SectionHeader eyebrow={t.milestonesEyebrow} title={t.milestonesTitle} />
            </div>
            <ol data-reveal className="timeline relative flex flex-col gap-8 pl-10">
              <span aria-hidden="true" className="timeline-rail absolute top-2 bottom-2 left-[11px] w-px bg-fg/10">
                <span className="timeline-line absolute inset-0 origin-top bg-gradient-to-b from-brand-sky via-cyan-300 to-gold" />
              </span>
              {milestones.map((m, i) => (
                <li key={m.id} className="timeline-item relative" style={{ "--i": i } as CSSProperties}>
                  <span aria-hidden="true" className="absolute top-1.5 -left-10 flex size-6 items-center justify-center rounded-full border border-brand-sky/50 bg-navy-900">
                    <span className="size-2 rounded-full bg-cyan-300 shadow-[0_0_12px_3px_rgb(103_232_249/0.6)]" />
                  </span>
                  <Link href={m.href} className="spotlight glass group block rounded-3xl p-6 transition-transform duration-500 hover:-translate-y-1">
                    <time className="font-mono text-xs text-cyan-300">{formatEventDate(m.date, m.approx, loc)}</time>
                    <h3 className="mt-2 font-display text-xl leading-snug font-semibold tracking-tight text-balance">{m.title}</h3>
                    {m.summary && <p className="mt-2 text-sm leading-relaxed text-text-secondary">{m.summary}</p>}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </Shell>
      )}

      {/* People */}
      <Shell className="pb-14 md:pb-16">
        <div className="flex flex-col gap-12">
          <SectionHeader eyebrow={t.peopleEyebrow} title={t.peopleTitle} />
          <ul className={cn("grid gap-4 md:grid-cols-3", people.length === 4 && "md:grid-cols-2 xl:grid-cols-4")}>
            {people.map((p, i) => (
              <li key={p.href} data-reveal style={{ "--d": i } as CSSProperties}>
                <Link href={`/${loc}/${p.href}`} className="spotlight glass group flex h-full flex-col gap-5 rounded-3xl p-7 transition-transform duration-500 hover:-translate-y-1">
                  <span className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-fg/10 bg-brand-sky/10 text-brand-sky">
                      <Icon name={p.icon} className="size-6" />
                    </span>
                    {p.count > 0 && <span className="font-mono text-sm text-text-secondary">{nf.format(p.count)}</span>}
                  </span>
                  <span className="font-display text-2xl font-semibold tracking-tight">{p.title}</span>
                  <span className="text-sm leading-relaxed text-text-secondary">{p.body}</span>
                  <span className="mt-auto text-sm font-semibold text-brand-sky transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Shell>

      {/* Sections added in Admin → Pages → About (e.g. core values) */}
      {ctx && <Sections sections={sections} ctx={ctx} />}

      <CtaBand t={t} locale={loc} />
    </div>
  );
}
