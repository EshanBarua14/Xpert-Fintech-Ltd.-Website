import { plain } from "@/components/ui/Emph";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CtaBand, PageHero, SectionHeader, Shell } from "@/components/flagship/Sections";
import { monogram } from "@/components/organizations/LogoWall";
import { ConsortiumExplorer } from "@/components/organizations/ConsortiumExplorer";
import { CountUp } from "@/components/motion/CountUp";
import { Icon } from "@/components/ui/Icon";
import { getConsortium } from "@/lib/public/consortium";
import Image from "next/image";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getFlagshipData } from "@/lib/public/flagship";
import { LiveApps } from "@/components/organizations/LiveApps";
import { getLiveApps } from "@/lib/public/company";
import { buildMetadata } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.consortiumPageTitle, description: t.consortiumPageBody, paths: { en: "consortium", bn: "consortium" } });
}

/**
 * The consortium and how it hangs together: the member brokerage houses own
 * Xpert, sit on its board, and run their own branded apps on its platform.
 * An interactive map shows each house's links; everything comes from Admin →
 * Organizations, People and Deployments.
 */
export default async function ConsortiumPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  const [data, members, liveApps] = await Promise.all([getFlagshipData(locale), getConsortium(locale), getLiveApps(locale)]);
  const nf = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US");
  // Every branded app live on the platform (the same count as on the home page).
  const apps = liveApps.length;
  const steps = [
    { icon: "users", title: t.consStep1Title, body: t.consStep1Body.replace("{n}", nf.format(members.length)) },
    { icon: "shield", title: t.consStep2Title, body: t.consStep2Body },
    { icon: "network", title: t.consStep3Title, body: t.consStep3Body },
    { icon: "exchange", title: t.consStep4Title, body: t.consStep4Body },
  ];

  return (
    <>
      <PageHero eyebrow={t.consortiumEyebrow} title={t.consortiumPageTitle} body={t.consortiumPageBody} />


      {members.length > 0 && (
        <>
          {/* The figures behind the relationships */}
          <Shell className="pb-4">
            <dl className="grid max-w-xl grid-cols-2 border-t border-fg/10 pt-6">
              {[
                [members.length, t.consAllMembers],
                [apps, t.consStatApps],
              ].map(([v, l], i) => (
                <div key={String(l)} data-reveal style={{ "--d": i } as CSSProperties} className={i ? "flex flex-col gap-1 border-l border-fg/10 pl-4 sm:pl-6" : "flex flex-col gap-1"}>
                  <dt className="order-2 text-sm text-text-secondary">{l}</dt>
                  <dd className="order-1 font-display text-4xl leading-none text-text-primary md:text-5xl">
                    <CountUp value={Number(v)} locale={locale} />
                  </dd>
                </div>
              ))}
            </dl>
          </Shell>

          {/* How it fits together: a chain of four links */}
          <Shell className="py-12 md:py-16">
            <div className="flex flex-col gap-10">
              <SectionHeader title={t.consHowTitle} body={t.consHowBody} />
              <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {steps.map((s, i) => (
                  <li key={s.title} data-reveal style={{ "--d": i } as CSSProperties} className="cons-step relative flex flex-col gap-4 rounded-3xl border border-fg/[0.08] bg-fg/[0.02] p-6">
                    <span className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-sky/10 text-brand-sky">
                        <Icon name={s.icon} className="size-5" />
                      </span>
                      {i < steps.length - 1 && (
                        <span aria-hidden="true" className="cons-arrow hidden h-px flex-1 bg-gradient-to-r from-brand-sky/50 to-transparent lg:block" />
                      )}
                    </span>
                    <span className="font-display text-xl leading-snug font-semibold text-text-primary">{s.title}</span>
                    <span className="text-sm leading-relaxed text-text-secondary">{s.body}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Shell>

          {/* Interactive map of the relationships */}
          <Shell className="py-12 md:py-16">
            <div className="flex flex-col gap-10">
              <SectionHeader title={t.consExplorerTitle} body={t.consExplorerBody} />
              <ConsortiumExplorer
                members={members}
                locale={locale}
                labels={{
                  title: plain(t.consExplorerTitle),
                  body: t.consExplorerBody,
                  hub: t.consHub,
                  pick: t.consPick,
                  pickBody: t.consPickBody,
                  shareholder: t.consShareholder,
                  boardSeat: t.consBoardSeat,
                  consultant: t.consConsultant,
                  appLive: t.consAppLive,
                  representedBy: t.consRepresentedBy,
                  roleAtXpert: t.consRoleAtXpert,
                  apps: t.consApps,
                  noApp: t.consNoApp,
                  noRep: t.consNoRep,
                  repPending: locale === "bn" ? "প্রতিনিধির নাম শিগগিরই" : "Representative to be announced",
                  representative: locale === "bn" ? "অনুমোদিত প্রতিনিধি, এক্সপার্ট ফিনটেক লিমিটেড" : "Authorized Representative, Xpert Fintech Ltd.",
                  website: t.consWebsite,
                  contact: { linkedin: t.linkedinProfile, email: t.emailPerson, linkedinSearch: t.linkedinSearch, emailMissing: t.emailMissing, website: locale === "bn" ? "ওয়েবসাইট" : "Website" },
                  android: t.getAndroidApp,
                  ios: t.getIosApp,
                  web: t.openWebApp,
                  legendSeat: t.consLegendSeat,
                  legendApp: t.consLegendApp,
                  legendOwns: t.consLegendOwns,
                  allMembers: t.consAllMembers,
                  boardHref: `/${locale}/company/board`,
                  consultantsHref: `/${locale}/company/consultants`,
                  viewProfile: t.viewProfile,
                  play: t.consPlay,
                  pause: t.consPause,
                  next: t.consNext,
                  prev: t.consPrev,
                  autoHint: t.consAutoHint,
                  dseTrec: t.consDseTrec,
                  cseTrec: t.consCseTrec,
                  rank: { broker: t.rankBroker, asOf: t.rankAsOf, source: t.rankSourceLabel },
                  visitWebsite: t.consVisitWebsite,
                }}
              />
            </div>
          </Shell>
        </>
      )}

      {/* Every branded trading app on the platform, with its Google Play and App Store links. */}
      {liveApps.length > 0 && (
        <Shell className="py-12 md:py-16">
          <div className="flex flex-col gap-10">
            <SectionHeader title={t.consAppsTitle} body={t.consAppsBody} />
            <LiveApps apps={liveApps} labels={{ android: t.getAndroidApp, ios: t.getIosApp, web: t.openWebApp, site: t.brokerWebsite, featured: t.featuredApp, rank: { broker: t.rankBroker, asOf: t.rankAsOf, source: t.rankSourceLabel }, locale }} />
          </div>
        </Shell>
      )}

      {data.exchanges.length > 0 && (
        <Shell className="py-12">
          <div className="flex flex-col gap-10">
            <SectionHeader title={t.exchanges} />
            <ul className="grid gap-4 md:grid-cols-2">
              {data.exchanges.map((e, i) => {
                const inner = (
                  <>
                    {e.logo ? (
                      <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 ring-1 ring-black/5">
                        <Image src={e.logo.url} alt="" width={e.logo.width ?? 160} height={e.logo.height ?? 64} className="size-full object-contain" />
                      </span>
                    ) : (
                      <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-sky/10 font-mono text-sm font-semibold text-accent">
                        {monogram(e.name, e.shortName)}
                      </span>
                    )}
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="font-display text-xl font-semibold">{e.name}</span>
                      {e.websiteUrl && (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-sky group-hover:underline">
                          {e.websiteUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                          <span aria-hidden="true">↗</span>
                        </span>
                      )}
                    </span>
                  </>
                );
                return (
                  <li key={e.id} data-reveal style={{ "--d": i } as CSSProperties} className="flex">
                    {e.websiteUrl ? (
                      <a
                        href={e.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex w-full items-center gap-5 rounded-2xl border border-fg/10 p-6 transition-colors hover:border-brand-sky/50 hover:bg-brand-sky/[0.04] sm:p-8"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex w-full items-center gap-5 rounded-2xl border border-fg/10 p-6 sm:p-8">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </Shell>
      )}

      <CtaBand t={t} locale={locale} />
    </>
  );
}
