import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand, PageHero, SectionHeader, Shell } from "@/components/flagship/Sections";
import { Icon } from "@/components/ui/Icon";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getJobs } from "@/lib/public/insights";
import { buildMetadata } from "@/lib/public/seo";
import { employmentLabel, jobTag } from "@/lib/public/labels";
import { JobBoard, type JobRowData } from "@/components/careers/JobBoard";
import { getSiteInfo } from "@/lib/content/settings";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.seoCareersTitle, description: t.careersBody, paths: { en: "careers", bn: "careers" } });
}


/** Jobs from Admin → Careers, grouped by department; open roles first. */
export default async function CareersPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as AppLocale;
  const t = getMessages(loc);
  const [jobs, info] = await Promise.all([getJobs(loc), getSiteInfo(loc)]);
  const companyLinkedIn = info.socialLinks.find((l) => /linkedin\.com\/company\//i.test(l.url))?.url ?? null;
  const dateFmt = new Intl.DateTimeFormat(loc === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  const rows: JobRowData[] = jobs.map((j) => ({
    id: j.id,
    href: j.href,
    title: j.title,
    summary: j.summary,
    dept: j.department ? jobTag(j.department, loc) : null,
    type: employmentLabel(t, j.employmentType),
    location: j.location ? jobTag(j.location, loc) : null,
    open: j.open,
    deadline: j.deadline ? t.applyBy.replace("{date}", dateFmt.format(j.deadline)) : null,
    apply: [
      j.linkedinUrl ? { kind: "linkedin" as const, href: j.linkedinUrl, label: t.applyLinkedIn } : companyLinkedIn ? { kind: "linkedin" as const, href: `${companyLinkedIn.replace(/\/+$/, "")}/jobs/`, label: t.applyLinkedInCompany } : null,
      j.bdjobsUrl ? { kind: "bdjobs" as const, href: j.bdjobsUrl, label: t.applyBdjobs } : null,
      j.applyEmail ? { kind: "email" as const, href: `mailto:${j.applyEmail}?subject=${encodeURIComponent(j.title)}`, label: t.applyByEmail } : null,
    ].filter((x): x is NonNullable<typeof x> => x !== null),
  }));
  const why = [
    { icon: "exchange", title: t.whyCareer1Title, body: t.whyCareer1Body },
    { icon: "users", title: t.whyCareer2Title, body: t.whyCareer2Body },
    { icon: "shield", title: t.whyCareer3Title, body: t.whyCareer3Body },
  ];

  return (
    <>
      <PageHero crumb={{ locale, path: "careers", name: t.careersTitle, home: t.home }} eyebrow={t.companyEyebrow} title={t.careersHero} body={t.careersBody} />
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
            <JobBoard
              jobs={rows}
              locale={loc}
              labels={{ all: t.jobsAll, closed: t.jobClosed, view: t.viewJob, viewAndApply: t.viewAndApply, filter: t.jobsFilter, showing: t.jobsShowing }}
            />
          )}
        </div>
      </Shell>
      <CtaBand t={t} locale={loc} />
    </>
  );
}

