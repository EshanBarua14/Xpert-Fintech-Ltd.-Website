import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand, PageHero, Shell } from "@/components/flagship/Sections";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getCaseStudies } from "@/lib/public/insights";
import { buildMetadata } from "@/lib/public/seo";
import { contentSlots } from "@/lib/env/hints";
import { ContentSlot } from "@/components/ui/ContentSlot";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.caseStudiesTitle, description: t.caseStudiesBody, paths: { en: "case-studies", bn: "case-studies" } });
}

export default async function CaseStudiesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as AppLocale;
  const t = getMessages(loc);
  const items = await getCaseStudies(loc);
  return (
    <>
      <PageHero eyebrow={t.insightsEyebrow} title={t.caseStudiesTitle} body={t.caseStudiesBody} />
      <Shell className="pb-16 md:pb-20">
        {items.length === 0 ? (
          contentSlots() ? (
            // Outside the live site: where the first case studies go.
            <ul className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <li key={i}>
                  <ContentSlot kind="caseStudy" locale={loc} adminHref="/admin/case-studies/new" className="min-h-56" />
                </li>
              ))}
            </ul>
          ) : (
            <div data-reveal className="glass rounded-[2rem] p-10 text-center md:p-16">
              <p className="font-display text-2xl font-semibold">{t.caseStudiesEmptyTitle}</p>
              <p className="mx-auto mt-3 max-w-xl text-text-secondary">{t.caseStudiesEmptyBody}</p>
            </div>
          )
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {items.map((c, i) => (
              <li key={c.id} data-reveal style={{ "--d": i % 2 } as CSSProperties}>
                <Link href={c.href} className="spotlight glass group flex h-full flex-col overflow-hidden rounded-3xl transition-transform duration-500 hover:-translate-y-1">
                  <span className="relative block aspect-[16/9] overflow-hidden bg-navy-800">
                    {c.cover ? (
                      <Image src={c.cover.url} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                    ) : (
                      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-brand-royal/40 via-navy-800 to-ink-950">
                      </span>
                    )}
                  </span>
                  <span className="flex flex-1 flex-col gap-3 p-7">
                    {c.draft && (
                      <span className="self-start rounded-md border border-gold/50 bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
                        {loc === "bn" ? "খসড়া — লাইভ সাইটে দেখা যায় না" : "Draft — not on the live site"}
                      </span>
                    )}
                    <span className="font-display text-2xl leading-snug font-semibold tracking-tight text-balance">{c.title}</span>
                    {c.summary && <span className="line-clamp-3 text-text-secondary">{c.summary}</span>}
                    <span className="mt-auto pt-2 text-sm font-semibold text-brand-sky">{t.readCaseStudy}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Shell>
      <CtaBand t={t} locale={loc} />
    </>
  );
}
