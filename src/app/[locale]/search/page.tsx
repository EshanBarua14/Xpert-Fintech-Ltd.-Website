import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, Shell } from "@/components/flagship/Sections";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { searchLabels } from "@/lib/public/labels";
import { searchSite } from "@/lib/public/search";
import { buildMetadata } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, title: getMessages(locale).searchTitle, paths: { en: "search", bn: "search" }, noindex: true });
}

/** Full search results (also works without JavaScript). */
export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  const labels = searchLabels(t);
  const raw = (await searchParams).q;
  const q = (typeof raw === "string" ? raw : "").trim().slice(0, 80);
  const hits = q.length >= 2 ? await searchSite(locale, q) : [];
  const nf = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US");
  const groups = [...new Set(hits.map((h) => h.kind))].map((kind) => ({ kind, items: hits.filter((h) => h.kind === kind) }));

  return (
    <>
      <PageHero title={t.searchTitle}>
        <form action={`/${locale}/search`} role="search" className="flex max-w-2xl gap-2">
          <label className="flex-1">
            <span className="sr-only">{t.searchLabel}</span>
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder={t.searchPlaceholder}
              className="h-14 w-full rounded-full border border-fg/15 bg-ink-950/60 px-6 text-lg focus:border-brand-sky focus:outline-none"
            />
          </label>
          <button type="submit" className="btn-glow h-14 rounded-full px-6 font-semibold text-white">
            {t.searchLabel}
          </button>
        </form>
      </PageHero>
      <Shell className="pb-24">
        {q.length < 2 ? (
          <p className="text-text-secondary">{t.searchHint}</p>
        ) : hits.length === 0 ? (
          <p className="text-text-secondary" role="status">
            {t.searchNoResults.replace("{q}", q)}
          </p>
        ) : (
          <div className="flex flex-col gap-10">
            <p className="text-sm text-text-secondary" role="status">
              {t.searchResultsFor.replace("{n}", nf.format(hits.length)).replace("{q}", q)}
            </p>
            {groups.map((g) => (
              <section key={g.kind} className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold tracking-[0.16em] text-text-secondary uppercase">{labels.kinds[g.kind as keyof typeof labels.kinds] ?? g.kind}</h2>
                <ul className="grid gap-3 md:grid-cols-2">
                  {g.items.map((h) => (
                    <li key={h.href + h.title}>
                      <Link href={h.href} className="glass flex h-full flex-col gap-1 rounded-2xl p-5 transition-colors hover:border-brand-sky/40">
                        <span className={g.kind === "symbol" ? "font-mono font-semibold" : "font-display text-lg font-semibold"}>{h.title}</span>
                        {h.subtitle && <span className="line-clamp-2 text-sm text-text-secondary">{h.subtitle}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Shell>
    </>
  );
}
