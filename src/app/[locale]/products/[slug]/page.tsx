import { cn } from "@/lib/utils/cn";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ecosystemLabels, ecosystemModules, GhostButton, moduleForSlug, PrimaryButton, SectionHeader } from "@/components/flagship/Sections";
import { EcosystemMap } from "@/components/flagship/EcosystemMap";
import OmsPreview from "@/components/products/oms-preview/OmsPreview";
import { getFlagshipData } from "@/lib/public/flagship";
import { ecosystemInDatabase, getEcosystem, withEcosystem } from "@/lib/public/ecosystem";
import { omsLabels } from "@/lib/public/labels";
import { CapabilityVisual, type VisualKind } from "@/components/flagship/Visuals";
import { Icon } from "@/components/ui/Icon";
import { OrderFlow } from "@/components/diagrams/OrderFlow";
import { ProductCard } from "@/components/products/ProductCard";
import { MediaImage, Paragraphs } from "@/components/blocks/Shared";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages, type Messages } from "@/lib/i18n/messages";
import { getOfferingBySlug, getSeo, mediaMap } from "@/lib/public/content";
import { breadcrumbLd, buildMetadata, JsonLd, SITE_URL } from "@/lib/public/seo";
import { parseVideoUrl, pick, videoEmbedUrl } from "@/lib/public/text";
import { ProductDemo } from "@/components/products/ProductDemo";
import { DemoPlaceholder, ScreensPlaceholder } from "@/components/products/MediaPlaceholder";
import { Lightbox } from "@/components/gallery/Lightbox";
import type { GalleryPhoto } from "@/lib/public/insights";

type Props = { params: Promise<{ locale: string; slug: string }> };
type Offering = NonNullable<Awaited<ReturnType<typeof getOfferingBySlug>>>;

async function load(locale: string, slug: string) {
  if (!isLocale(locale) || !/^[a-z0-9-]+$/.test(slug)) return null;
  const offering = await getOfferingBySlug(locale, slug);
  return offering ? { offering, locale } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const found = await load(locale, slug);
  if (!found) return {};
  const tr = pick(found.offering.translations, found.locale)!;
  const seo = await getSeo("OFFERING", found.offering.id, found.locale);
  const paths: Partial<Record<AppLocale, string>> = {};
  for (const t of found.offering.translations) if (t.locale === "en" || t.locale === "bn") paths[t.locale] = `products/${t.slug}`;
  return buildMetadata({
    locale: found.locale,
    title: seo?.title ?? tr.name,
    description: seo?.description ?? tr.tagline ?? tr.summary,
    paths,
    ogImageId: seo?.ogImageId ?? found.offering.heroMediaId,
  });
}

/** Illustration shown when a product has no hero image yet. */
function visualFor(slug: string, type: string): VisualKind {
  if (/rms|risk/.test(slug)) return "risk";
  if (/ekyc|kyc/.test(slug)) return "ekyc";
  if (/bo-account|account-opening/.test(slug)) return "bo";
  if (/dms|document/.test(slug)) return "dms";
  if (/back-office/.test(slug)) return "back";
  if (/market-data|data/.test(slug)) return "data";
  return type === "PLATFORM" ? "trading" : "trading";
}

type ItemKind = Offering["items"][number]["kind"];

function itemsOf(offering: Offering, kind: ItemKind, locale: AppLocale) {
  return offering.items
    .filter((i) => i.kind === kind)
    .map((i) => {
      const tr = pick(i.translations, locale);
      return { id: i.id, icon: i.iconName, title: tr?.title ?? "", body: tr?.body ?? null };
    })
    .filter((i) => i.title);
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  const found = await load(locale, slug);
  if (!found) notFound();
  const { offering } = found;
  const t = getMessages(found.locale);
  const tr = pick(offering.translations, found.locale)!;

  const images = await mediaMap(
    [offering.heroMediaId, ...offering.media.flatMap((m) => [m.mediaId, m.posterMediaId]), ...offering.items.map((i) => i.mediaId)],
    found.locale,
  );
  const hero = images.get(offering.heroMediaId ?? "");
  const capabilities = itemsOf(offering, "CAPABILITY", found.locale);
  const steps = itemsOf(offering, "WORKFLOW_STEP", found.locale);
  const layers = itemsOf(offering, "ARCHITECTURE_LAYER", found.locale);
  const integrations = itemsOf(offering, "INTEGRATION", found.locale);
  const security = itemsOf(offering, "SECURITY", found.locale);
  const useCases = itemsOf(offering, "USE_CASE", found.locale);
  const targetUsers = itemsOf(offering, "TARGET_USER", found.locale);
  const faqs = itemsOf(offering, "FAQ", found.locale);
  const screenshots = offering.media.filter((m) => m.kind !== "VIDEO" && m.mediaId && images.has(m.mediaId));
  // The first playable video is the product demo (a link, or an uploaded file).
  const preview = process.env.APP_ENV !== "production";
  const demo = offering.media.find((m) => m.kind === "VIDEO" && (videoEmbedUrl(m.videoUrl) || (m.mediaId && images.has(m.mediaId))));
  const demoPoster = demo ? (images.get(demo.posterMediaId ?? "")?.url ?? parseVideoUrl(demo.videoUrl)?.thumbnail ?? null) : null;
  const shots: GalleryPhoto[] = screenshots.map((m) => {
    const img = images.get(m.mediaId!)!;
    return { id: m.id, url: img.url, alt: pick(m.translations, found.locale)?.caption ?? img.alt ?? tr.name, width: img.width, height: img.height };
  });
  const parent = offering.parent && offering.parent.status === "PUBLISHED" && !offering.parent.deletedAt ? offering.parent : null;
  const parentTr = parent ? pick(parent.translations, found.locale) : null;
  const demoHref = `/${found.locale}/request-demo?product=${encodeURIComponent(tr.slug)}`;
  const ctaLabel = tr.ctaLabel ?? t.requestDemo;

  const url = `${SITE_URL}/${found.locale}/products/${tr.slug}`;
  const enSlug = offering.translations.find((x) => x.locale === "en")?.slug ?? tr.slug;
  const ecoModule = moduleForSlug(enSlug);
  const [flagship, eco, ecoInDb] = ecoModule
    ? await Promise.all([getFlagshipData(found.locale), getEcosystem(found.locale), ecosystemInDatabase()])
    : [null, { nodes: [], edges: [], flows: [] }, false];
  const showOmsPreview = offering.key === "trading-platform";

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: t.home, url: `${SITE_URL}/${found.locale}` },
          { name: t.products, url: `${SITE_URL}/${found.locale}/products` },
          { name: tr.name, url },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: tr.name,
          applicationCategory: "BusinessApplication",
          description: tr.summary ?? tr.tagline ?? undefined,
          url,
          publisher: { "@type": "Organization", name: "Xpert Fintech Ltd.", url: SITE_URL },
        }}
      />

      {/* Hero */}
      <section className="relative -mt-20 overflow-hidden pt-20 md:-mt-24 md:pt-24">
        <div className="aurora" />
        <div className="grid-fade pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="flex flex-col gap-7">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-text-secondary" data-reveal>
              <Link href={`/${found.locale}/products`} className="hover:text-fg">
                {t.products}
              </Link>
              {parent && parentTr && (
                <>
                  <span aria-hidden="true">/</span>
                  <Link href={`/${found.locale}/products/${parentTr.slug}`} className="hover:text-fg">
                    {parentTr.name}
                  </Link>
                </>
              )}
            </nav>
            <h1
              data-reveal
              style={{ "--d": 1 } as CSSProperties}
              className="text-gradient font-display text-5xl leading-[1.02] font-semibold tracking-[-0.04em] text-balance md:text-7xl"
            >
              {tr.name}
            </h1>
            {tr.tagline && (
              <p data-reveal style={{ "--d": 2 } as CSSProperties} className="text-gradient-brand text-xl font-medium md:text-2xl">
                {tr.tagline}
              </p>
            )}
            <div data-reveal style={{ "--d": 3 } as CSSProperties}>
              <Paragraphs text={tr.summary} className="text-lg" />
            </div>
            {offering.showDemoCta && (
              <div data-reveal style={{ "--d": 4 } as CSSProperties} className="flex flex-wrap gap-3">
                <PrimaryButton href={demoHref}>{ctaLabel}</PrimaryButton>
                <GhostButton href={`/${found.locale}/platform`}>{t.explorePlatform}</GhostButton>
              </div>
            )}
          </div>
          <div data-reveal style={{ "--d": 2 } as CSSProperties}>
            {hero ? (
              <div className="glass overflow-hidden rounded-3xl p-2 shadow-[0_40px_120px_-40px_rgb(34_188_235/0.5)]">
                <MediaImage media={hero} priority className="rounded-2xl" />
              </div>
            ) : (
              <div className="glass relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl p-10 shadow-[0_40px_120px_-40px_rgb(34_188_235/0.5)]">
                <div className="grid-fade pointer-events-none absolute inset-0 opacity-60" />
                <div className="relative h-full w-full">
                  <CapabilityVisual kind={visualFor(tr.slug, offering.type)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {(tr.problem || tr.solution) && (
        <Band>
          <div className="grid gap-4 md:grid-cols-2">
            {tr.problem && (
              <div data-reveal className="glass flex flex-col gap-5 rounded-3xl p-8">
                <h2 className="eyebrow">{t.theProblem}</h2>
                <Paragraphs text={tr.problem} className="text-lg" />
              </div>
            )}
            {tr.solution && (
              <div data-reveal style={{ "--d": 1 } as CSSProperties} className="beam glass flex flex-col gap-5 rounded-3xl p-8">
                <h2 className="eyebrow">{t.theSolution}</h2>
                <Paragraphs text={tr.solution} className="text-lg text-text-primary" />
              </div>
            )}
          </div>
        </Band>
      )}

      {demo && (
        <Band title={t.demoTitle} body={t.demoBody}>
          <div data-reveal className="mx-auto w-full max-w-5xl">
            <ProductDemo
              title={pick(demo.translations, found.locale)?.caption ?? `${tr.name}: ${t.demoTitle}`}
              caption={pick(demo.translations, found.locale)?.caption}
              poster={demoPoster}
              embedUrl={videoEmbedUrl(demo.videoUrl)}
              fileUrl={!demo.videoUrl && demo.mediaId ? (images.get(demo.mediaId)?.url ?? null) : null}
              playLabel={t.playVideo}
            />
          </div>
        </Band>
      )}

      {/* Until the demo video and screens are added, outside production show where they go. */}
      {!demo && preview && (
        <Band title={t.demoTitle} body={t.demoBody}>
          <div className="mx-auto w-full max-w-5xl">
            <DemoPlaceholder name={tr.name} adminHref={`/admin/products/${offering.id}#media`} />
          </div>
        </Band>
      )}

      {capabilities.length > 0 && (
        <Band title={t.capabilities} alt>
          <ItemGrid items={capabilities} />
        </Band>
      )}

      {showOmsPreview && (
        <Band title={t.omsPreviewTitle}>
          <p data-reveal className="-mt-6 max-w-2xl text-lg text-text-secondary">{t.omsPreviewBody}</p>
          <div data-reveal>
            <OmsPreview labels={omsLabels(t)} />
          </div>
        </Band>
      )}

      {steps.length > 1 && (
        <Band title={t.howItWorks}>
          <div data-reveal className="glass rounded-3xl p-4 md:p-8">
          <OrderFlow
            caption={t.conceptualView}
            steps={steps.map((s, i) => ({ key: s.id, label: s.title, note: s.body, highlight: i === 0 }))}
          />
          </div>
        </Band>
      )}

      {shots.length > 0 && (
        <Band title={t.screensTitle} body={t.screensBody} alt>
          <div>
            <Lightbox layout="feature" photos={shots} labels={{ open: t.openPhoto, close: t.close, prev: t.prevPhoto, next: t.nextPhoto, counter: t.photoCounter }} />
          </div>
        </Band>
      )}

      {shots.length === 0 && preview && (
        <Band title={t.screensTitle} body={t.screensBody} alt>
          <ScreensPlaceholder adminHref={`/admin/products/${offering.id}#media`} />
        </Band>
      )}

      {layers.length > 0 && (
        <Band title={t.architecture}>
          <ol className="flex flex-col gap-3">
            {layers.map((l, i) => (
              <li
                key={l.id}
                data-reveal
                style={{ "--d": i } as CSSProperties}
                className="spotlight glass grid items-center gap-2 rounded-2xl p-5 md:grid-cols-[3rem_240px_1fr]"
              >
                <span className="font-mono text-xs text-cyan-300">L{i + 1}</span>
                <span className="font-display font-semibold">{l.title}</span>
                {l.body && <span className="text-sm text-text-secondary">{l.body}</span>}
              </li>
            ))}
          </ol>
        </Band>
      )}

      {integrations.length > 0 && (
        <Band title={t.integrations} alt>
          <ItemGrid items={integrations} />
        </Band>
      )}

      {security.length > 0 && (
        <Band title={t.security}>
          <ItemGrid items={security} icon="shield" />
        </Band>
      )}

      {(useCases.length > 0 || targetUsers.length > 0 || tr.targetCustomers) && (
        <Band alt>
          <div className={cn("grid gap-4", useCases.length > 0 && (targetUsers.length > 0 || tr.targetCustomers) && "md:grid-cols-2")}>
            {useCases.length > 0 && (
              <div data-reveal className="glass flex flex-col gap-6 rounded-3xl p-8">
                <h2 className="font-display text-2xl font-semibold tracking-tight">{t.useCases}</h2>
                <ItemList items={useCases} />
              </div>
            )}
            {(targetUsers.length > 0 || tr.targetCustomers) && (
              <div data-reveal style={{ "--d": 1 } as CSSProperties} className="glass flex flex-col gap-6 rounded-3xl p-8">
                <h2 className="font-display text-2xl font-semibold tracking-tight">{t.whoItsFor}</h2>
                {tr.targetCustomers && <p className="text-text-secondary">{tr.targetCustomers}</p>}
                <ItemList items={targetUsers} />
              </div>
            )}
          </div>
        </Band>
      )}

      {ecoModule && flagship && (
        <Band title={t.whereItFits} alt>
          <p data-reveal className="-mt-6 max-w-2xl text-lg text-text-secondary">{t.whereItFitsBody}</p>
          <div data-reveal className="glass rounded-3xl p-4 md:p-8">
            <EcosystemMap labels={{ ...ecosystemLabels(t, found.locale), steps: undefined }} logos={flagship.logos} modules={withEcosystem(ecosystemModules(flagship.offerings, found.locale), eco, ecoInDb)} focus={ecoModule} />
          </div>
        </Band>
      )}

      {offering.children.length > 0 && (
        <Band title={t.modules}>
          <ul className={cn("grid gap-4", gridCols(offering.children.length))}>
            {offering.children.map((c, i) => (
              <li key={c.id} data-reveal style={{ "--d": i % 3 } as CSSProperties}>
                <ProductCard offering={c} locale={found.locale} t={t} />
              </li>
            ))}
          </ul>
        </Band>
      )}

      {offering.deployments.length > 0 && <Deployments offering={offering} locale={found.locale} t={t} />}

      {faqs.length > 0 && (
        <Band title={t.faq}>
          <div className="flex max-w-3xl flex-col gap-3">
            {faqs.map((f) => (
              <details key={f.id} data-reveal className="group glass rounded-2xl px-6 py-5 open:border-brand-sky/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.title}
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border border-fg/15 text-brand-sky transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <Paragraphs text={f.body} className="mt-3 text-sm" />
              </details>
            ))}
          </div>
        </Band>
      )}

      {offering.showDemoCta && (
        <Band>
          <div data-reveal className="beam relative overflow-hidden rounded-[2rem] border border-fg/10 bg-navy-900/60 px-6 py-14 md:px-14 md:py-20">
            <div className="aurora opacity-70" />
            <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              <div className="flex max-w-2xl flex-col gap-3">
                <h2 className="text-gradient font-display text-4xl font-semibold tracking-[-0.035em] text-balance md:text-5xl">{t.ctaTitle}</h2>
                <p className="text-lg text-text-secondary">{tr.name}</p>
              </div>
              <PrimaryButton href={demoHref}>{ctaLabel}</PrimaryButton>
            </div>
          </div>
        </Band>
      )}
    </>
  );
}

/**
 * Card grid columns that avoid a lonely last card: 3 or 4 across on desktop,
 * whichever leaves no gap (or the smallest one); 1–4 items fill one row.
 */
function gridCols(n: number) {
  if (n <= 1) return "max-w-xl";
  if (n === 2) return "sm:grid-cols-2";
  if (n === 4 || (n % 4 === 0) || (n % 3 !== 0 && n % 4 > n % 3)) return "sm:grid-cols-2 lg:grid-cols-4";
  return "sm:grid-cols-2 lg:grid-cols-3";
}

function Band({ title, body, alt, children }: { title?: string; body?: string; alt?: boolean; children: React.ReactNode }) {
  return (
    <section className={alt ? "border-y border-fg/[0.06] bg-fg/[0.015]" : undefined}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-16 md:px-8 md:py-24">
        {title && <SectionHeader title={title} body={body} />}
        {children}
      </div>
    </section>
  );
}

function ItemGrid({ items, icon }: { items: { id: string; title: string; body: string | null; icon: string | null }[]; icon?: string }) {
  return (
    <ul className={cn("grid gap-4", gridCols(items.length))}>
      {items.map((i, n) => (
        <li key={i.id} data-reveal style={{ "--d": n % 3 } as CSSProperties} className="spotlight glass flex flex-col gap-4 rounded-3xl p-6 md:p-7">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-sky/25 to-brand-royal/20 text-cyan-300">
            <Icon name={i.icon ?? icon ?? "check"} className="size-5" />
          </span>
          <h3 className="font-display text-lg font-semibold tracking-tight">{i.title}</h3>
          {i.body && <p className="text-sm leading-relaxed whitespace-pre-line text-text-secondary">{i.body}</p>}
        </li>
      ))}
    </ul>
  );
}

function ItemList({ items }: { items: { id: string; title: string; body: string | null }[] }) {
  if (!items.length) return null;
  return (
    <ul className="flex flex-col gap-4">
      {items.map((i) => (
        <li key={i.id} className="flex gap-3">
          <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand-sky" />
          <span>
            <span className="font-medium">{i.title}</span>
            {i.body && <span className="block text-sm text-text-secondary">{i.body}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Deployments({ offering, locale, t }: { offering: Offering; locale: AppLocale; t: Messages }) {
  return (
    <Band title={t.deployments} alt>
      <ul className={cn("grid gap-4", gridCols(offering.deployments.length))}>
        {offering.deployments.map((d) => {
          const org = d.organization && d.organization.status === "PUBLISHED" && !d.organization.deletedAt ? pick(d.organization.translations, locale) : null;
          return (
            <li key={d.id} data-reveal className="spotlight glass flex flex-col gap-3 rounded-3xl p-6">
              <span className="font-display text-lg font-semibold">{d.appName}</span>
              {org && <span className="text-sm text-text-secondary">{org.name}</span>}
              <span className="mt-auto flex flex-wrap gap-3 text-sm">
                {d.playStoreUrl && (
                  <a href={d.playStoreUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-full border border-fg/15 px-4 text-brand-sky transition-colors hover:border-brand-sky/60 hover:text-fg">
                    {t.getAndroidApp} ↗
                  </a>
                )}
                {d.appStoreUrl && (
                  <a href={d.appStoreUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-full border border-fg/15 px-4 text-brand-sky transition-colors hover:border-brand-sky/60 hover:text-fg">
                    {t.getIosApp} ↗
                  </a>
                )}
                {d.webUrl && (
                  <a href={d.webUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-full border border-fg/15 px-4 text-brand-sky transition-colors hover:border-brand-sky/60 hover:text-fg">
                    {t.openWebApp} ↗
                  </a>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Band>
  );
}

