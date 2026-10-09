import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand, PageHero, SectionHeader, Shell } from "@/components/flagship/Sections";
import { Icon } from "@/components/ui/Icon";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages, type Messages } from "@/lib/i18n/messages";
import { getJobs, type JobCard } from "@/lib/public/insights";
import { buildMetadata } from "@/lib/public/seo";
import { employmentLabel, jobTag } from "@/lib/public/labels";
import { cn } from "@/lib/utils/cn";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.careersTitle, description: t.careersBody, paths: { en: "careers", bn: "careers" } });
}


function JobRow({ j, t, i, loc }: { j: JobCard; t: Messages; i: number; loc: AppLocale }) {
  return (
    <li data-reveal style={{ "--d": i % 4 } as CSSProperties}>
      <Link href={j.href} className={cn("spotlight glass group grid gap-4 rounded-3xl p-6 transition-transform duration-500 hover:-translate-y-0.5 md:grid-cols-[1fr_auto] md:items-center md:p-7")}>
        <span className="flex flex-col gap-2">
          <span className="flex flex-wrap items-center gap-2 text-xs">
            {j.department && <span className="rounded-full bg-brand-sky/10 px-2.5 py-1 font-semibold text-cyan-300">{jobTag(j.department, loc)}</span>}
            <span className="rounded-full border border-fg/10 px-2.5 py-1 text-text-secondary">{employmentLabel(t, j.employmentType)}</span>
            {j.location && <span className="rounded-full border border-fg/10 px-2.5 py-1 text-text-secondary">{jobTag(j.location, loc)}</span>}
            {!j.open && <span className="rounded-full border border-gold/40 px-2.5 py-1 text-gold">{t.jobClosed}</span>}
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-text-primary md:text-2xl">{j.title}</span>
          {j.summary && <span className="line-clamp-2 text-sm text-text-secondary">{j.summary}</span>}
        </span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-sky">
          {j.open ? t.viewAndApply : t.viewJob}
         
        </span>
      </Link>
    </li>
  );
}

/** Jobs from Admin → Careers, grouped by department; open roles first. */
export default async function CareersPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as AppLocale;
  const t = getMessages(loc);
  const jobs = await getJobs(loc);
  const why = [
    { icon: "exchange", title: t.whyCareer1Title, body: t.whyCareer1Body },
    { icon: "users", title: t.whyCareer2Title, body: t.whyCareer2Body },
    { icon: "shield", title: t.whyCareer3Title, body: t.whyCareer3Body },
  ];

  return (
    <>
      <PageHero eyebrow={t.companyEyebrow} title={t.careersTitle} body={t.careersBody} />
      <Shell className="pb-14 md:pb-16">
        <ul className="grid gap-4 md:grid-cols-3">
          {why.map((w, i) => (
            <li key={w.title} data-reveal style={{ "--d": i } as CSSProperties} className="spotlight glass flex flex-col gap-4 rounded-3xl p-7">
              <span className="flex size-11 items-center justify-center rounded-2xl border border-fg/10 bg-brand-sky/10 text-brand-sky">
                <Icon name={w.icon} className="size-5" />
              </span>
              <span className="font-display text-lg font-semibold">{w.title}</span>
              <span className="text-sm leading-relaxed text-text-secondary">{w.body}</span>
            </li>
          ))}
        </ul>
      </Shell>
      <Shell id="openings" className="pb-16 md:pb-20">
        <div className="flex flex-col gap-10">
          <SectionHeader title={t.openRoles} />
          {jobs.length === 0 ? (
            <div data-reveal className="glass rounded-[2rem] p-10 md:p-14">
              <p className="font-display text-2xl font-semibold">{t.noJobsTitle}</p>
              <p className="mt-3 max-w-xl text-text-secondary">{t.noJobsBody}</p>
              <Link href={`/${loc}/contact`} className="mt-6 inline-flex h-11 items-center rounded-full border border-fg/15 px-5 text-sm font-semibold hover:border-brand-sky/60">
                {t.talkToUs}
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {jobs.map((j, i) => (
                <JobRow key={j.id} j={j} t={t} i={i} loc={loc} />
              ))}
            </ul>
          )}
        </div>
      </Shell>
      <CtaBand t={t} locale={loc} />
    </>
  );
}
