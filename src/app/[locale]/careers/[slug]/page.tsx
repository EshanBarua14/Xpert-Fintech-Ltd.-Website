import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/flagship/Sections";
import { ApplyForm } from "@/components/careers/ApplyForm";
import { Paragraphs } from "@/components/blocks/Shared";
import { Icon } from "@/components/ui/Icon";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { getSiteInfo } from "@/lib/content/settings";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getJobBySlug, listGroups } from "@/lib/public/insights";
import { breadcrumbLd, buildMetadata, JsonLd, SITE_URL } from "@/lib/public/seo";
import { turnstileSiteKey } from "@/lib/public/turnstile";
import { employmentLabel, jobTag } from "@/lib/public/labels";

type Props = { params: Promise<{ locale: string; slug: string }> };

async function load(locale: string, slug: string) {
  if (!isLocale(locale) || !/^[a-z0-9-]+$/.test(slug)) return null;
  const found = await getJobBySlug(locale as AppLocale, slug);
  return found ? { ...found, locale: locale as AppLocale } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const found = await load(locale, slug);
  if (!found) return {};
  const paths: Partial<Record<AppLocale, string>> = {};
  for (const t of found.career.translations) if (t.locale === "en" || t.locale === "bn") paths[t.locale] = `careers/${t.slug}`;
  return buildMetadata({ locale: found.locale, title: found.tr.title, description: found.tr.summary, paths });
}

const EMPLOYMENT_LD: Record<string, string> = { FULL_TIME: "FULL_TIME", PART_TIME: "PART_TIME", CONTRACT: "CONTRACTOR", INTERNSHIP: "INTERN" };

export default async function JobPage({ params }: Props) {
  const { locale, slug } = await params;
  const found = await load(locale, slug);
  if (!found) notFound();
  const { career, tr, open } = found;
  const loc = found.locale;
  const t = getMessages(loc);
  const url = `${SITE_URL}/${loc}/careers/${tr.slug}`;
  const deadline = career.deadline
    ? new Intl.DateTimeFormat(loc === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" }).format(career.deadline)
    : null;
  const sections = [
    { title: t.jobResponsibilities, groups: listGroups(tr.responsibilities) },
    { title: t.jobRequirements, groups: listGroups(tr.requirements) },
    { title: t.jobBenefits, groups: listGroups(tr.benefits) },
  ].filter((s) => s.groups.length);

  // Other ways to apply: the same job on LinkedIn and Bdjobs, or by email.
  const site = await getSiteInfo(loc);
  const companyLinkedIn = site.socialLinks.find((l) => /linkedin\.com\/company\//i.test(l.url))?.url;
  const linkedin = career.linkedinUrl ?? (companyLinkedIn ? `${companyLinkedIn.replace(/\/+$/, "")}/jobs/` : null);
  const enTitle = career.translations.find((x) => x.locale === "en")?.title ?? tr.title;
  const mailto = career.applyEmail
    ? `mailto:${career.applyEmail}?subject=${encodeURIComponent(`${enTitle} – ${t.applyEmailName}`)}&body=${encodeURIComponent(t.applyEmailBody)}`
    : null;
  const routes = [
    linkedin && { href: linkedin, label: career.linkedinUrl ? t.applyLinkedIn : t.applyLinkedInCompany, icon: <SocialIcon kind="linkedin" className="size-4" />, external: true },
    career.bdjobsUrl && { href: career.bdjobsUrl, label: t.applyBdjobs, icon: <Icon name="briefcase" className="size-4" />, external: true },
    mailto && { href: mailto, label: t.applyByEmail, note: career.applyEmail, icon: <SocialIcon kind="email" className="size-4" />, external: false },
  ].filter(Boolean) as { href: string; label: string; note?: string | null; icon: ReactNode; external: boolean }[];

  return (
    <article>
      <JsonLd data={breadcrumbLd([{ name: t.home, url: `${SITE_URL}/${loc}` }, { name: t.careersTitle, url: `${SITE_URL}/${loc}/careers` }, { name: tr.title, url }])} />
      {open && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "JobPosting",
            title: tr.title,
            description: [tr.summary, tr.responsibilities, tr.requirements].filter(Boolean).join("\n\n"),
            datePosted: (career.publishAt ?? career.createdAt).toISOString(),
            ...(career.deadline && { validThrough: career.deadline.toISOString() }),
            employmentType: EMPLOYMENT_LD[career.employmentType],
            hiringOrganization: { "@type": "Organization", name: "Xpert Fintech Ltd.", sameAs: SITE_URL, logo: `${SITE_URL}/brand/xpert-logo.png` },
            jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: career.location ?? "Dhaka", addressCountry: "BD" } },
          }}
        />
      )}
      <header className="hero-seq relative -mt-20 overflow-hidden pt-20 md:-mt-24 md:pt-24">
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-10 pb-8 md:px-8 md:pt-14">
          <Link href={`/${loc}/careers`} data-reveal className="text-sm text-text-secondary hover:text-fg">
            ← {t.allJobs}
          </Link>
          <p data-reveal className="flex flex-wrap gap-2 text-xs">
            {career.department && <span className="rounded-full bg-brand-sky/10 px-2.5 py-1 font-semibold text-cyan-300">{jobTag(career.department, loc)}</span>}
            <span className="rounded-full border border-fg/10 px-2.5 py-1 text-text-secondary">{employmentLabel(t, career.employmentType)}</span>
            {career.location && <span className="rounded-full border border-fg/10 px-2.5 py-1 text-text-secondary">{jobTag(career.location, loc)}</span>}
            {career.experience && <span className="rounded-full border border-fg/10 px-2.5 py-1 text-text-secondary">{jobTag(career.experience, loc)}</span>}
          </p>
          <h1 data-reveal className="max-w-4xl font-display text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-text-primary md:text-6xl">
            {tr.title}
          </h1>
          {tr.summary && <p data-reveal className="max-w-3xl text-xl leading-relaxed text-text-secondary">{tr.summary}</p>}
        </div>
      </header>
      <Shell className="pb-16 md:pb-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_26rem]">
          <div className="flex flex-col gap-10">
            {tr.about && (
              <section data-reveal className="flex flex-col gap-4 rounded-3xl border border-fg/[0.08] bg-fg/[0.02] p-6 md:p-8">
                <h2 className="font-display text-2xl font-semibold tracking-tight">{t.jobAbout}</h2>
                <Paragraphs text={tr.about} className="leading-relaxed text-text-primary/90" />
              </section>
            )}
            {sections.map((s) => (
              <section key={s.title} data-reveal className="flex flex-col gap-5">
                <h2 className="font-display text-2xl font-semibold tracking-tight">{s.title}</h2>
                {s.groups.map((g, gi) => (
                  <div key={gi} className="flex flex-col gap-3">
                    {g.heading && <h3 className="text-base font-semibold text-text-primary">{g.heading}</h3>}
                    <ul className="flex flex-col gap-3">
                      {g.items.map((item, i) => (
                        <li key={i} className="flex gap-3 leading-relaxed text-text-primary/90">
                          <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-cyan-300" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </div>
          <aside id="apply" className="lg:sticky lg:top-[calc(7rem+var(--ticker-h))] lg:self-start">
            <div data-reveal className="beam glass rounded-[2rem] p-6 md:p-8">
              {open ? (
                <>
                  <h2 className="font-display text-2xl font-semibold">{t.applyTitle}</h2>
                  {deadline && <p className="mt-1 text-sm text-text-secondary">{t.applyBy.replace("{date}", deadline)}</p>}
                  {routes.length > 0 && (
                    <>
                      <ul className="mt-6 flex flex-col gap-2">
                        {routes.map((r) => (
                          <li key={r.label}>
                            <a
                              href={r.href}
                              {...(r.external && { target: "_blank", rel: "noopener noreferrer" })}
                              className="flex min-h-12 items-center gap-3 rounded-2xl border border-fg/12 px-4 py-2.5 text-sm font-semibold transition-colors hover:border-brand-sky/60 hover:text-brand-sky"
                            >
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-sky/10 text-brand-sky">{r.icon}</span>
                              <span className="flex min-w-0 flex-1 flex-col">
                                {r.label}
                                {r.note && <span className="truncate text-xs font-normal text-text-secondary">{r.note}</span>}
                              </span>
                              {r.external && <span className="sr-only">{t.opensInNewTab}</span>}
                            </a>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-6 flex items-center gap-3 text-xs text-text-secondary before:h-px before:flex-1 before:bg-fg/10 after:h-px after:flex-1 after:bg-fg/10">{t.applyHere}</p>
                    </>
                  )}
                  <div className={routes.length ? "mt-4" : "mt-6"}>
                    <ApplyForm careerId={career.id} t={t} locale={loc} turnstileSiteKey={turnstileSiteKey()} />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-semibold">{t.jobClosedTitle}</h2>
                  <p className="mt-3 text-text-secondary">{t.jobClosedBody}</p>
                  <Link href={`/${loc}/careers`} className="mt-6 inline-flex h-11 items-center rounded-full border border-fg/15 px-5 text-sm font-semibold hover:border-brand-sky/60">
                    {t.allJobs}
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </Shell>
    </article>
  );
}
