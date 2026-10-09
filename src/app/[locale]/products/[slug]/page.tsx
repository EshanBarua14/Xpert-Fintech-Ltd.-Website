import { cn } from "@/lib/utils/cn";
import { getDesign } from "@/lib/content/design";
import { contentSlots } from "@/lib/env/hints";
import { ContentSlot } from "@/components/ui/ContentSlot";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ecosystemLabels, ecosystemModules, GhostButton, moduleForSlug, PrimaryButton, SectionHeader } from "@/components/flagship/Sections";
import { EcosystemMap } from "@/components/flagship/EcosystemMap";
import OmsPreview from "@/components/products/oms-preview/OmsPreview";
import { getFlagshipData, getPartyLogos } from "@/lib/public/flagship";
import { getCredentials } from "@/lib/content/credentials";
import { ecosystemInDatabase, getEcosystem, withEcosystem } from "@/lib/public/ecosystem";
import { omsLabels } from "@/lib/public/labels";
import type { VisualKind } from "@/components/flagship/Visuals";
import { Icon } from "@/components/ui/Icon";
import { ProductCard } from "@/components/products/ProductCard";
import { Paragraphs } from "@/components/blocks/Shared";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages, type Messages } from "@/lib/i18n/messages";
import { getOfferingBySlug, getSeo, mediaMap } from "@/lib/public/content";
import { breadcrumbLd, buildMetadata, JsonLd, SITE_URL } from "@/lib/public/seo";
import { parseVideoUrl, pick, videoEmbedUrl } from "@/lib/public/text";
import { ProductDemo } from "@/components/products/ProductDemo";
import { DemoPlaceholder } from "@/components/products/MediaPlaceholder";
import { DeviceShowcase } from "@/components/products/DeviceShowcase";
import { ProductMark, productVars } from "@/components/products/ProductMark";
import { AutomationFlow } from "@/components/products/AutomationFlow";
import { EcosystemPosition } from "@/components/products/EcosystemPosition";
import { Lightbox } from "@/components/gallery/Lightbox";
import type { GalleryPhoto } from "@/lib/public/insights";
import { fill } from "@/lib/i18n/digits";

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
      const en = i.translations.find((x) => x.locale === "en")?.title ?? "";
      return { id: i.id, icon: i.iconName, title: tr?.title ?? "", body: tr?.body ?? null, en };
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
  const productLogo = offering.iconMediaId ? (await mediaMap([offering.iconMediaId], found.locale)).get(offering.iconMediaId) : undefined;
  const [partyLogos, credentials] = await Promise.all([getPartyLogos(found.locale), getCredentials(found.locale)]);
  const deploymentLogos = await mediaMap(
    offering.deployments.map((d) => (d.organization?.logoPermission ? d.organization.logoMediaId : null)),
    found.locale,
  );
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
  // Where the demo video and screens go, shown outside the live site until they are added.
  const slots = contentSlots();
  const demo = offering.media.find((m) => m.kind === "VIDEO" && (videoEmbedUrl(m.videoUrl) || (m.mediaId && images.has(m.mediaId))));
  const demoPoster = demo ? (images.get(demo.posterMediaId ?? "")?.url ?? parseVideoUrl(demo.videoUrl)?.thumbnail ?? null) : null;
  const shots: (GalleryPhoto & { device: string | null })[] = screenshots.map((m) => {
    const img = images.get(m.mediaId!)!;
    return { id: m.id, url: img.url, alt: pick(m.translations, found.locale)?.caption ?? img.alt ?? tr.name, width: img.width, height: img.height, device: m.device };
  });
  const parent = offering.parent && offering.parent.status === "PUBLISHED" && !offering.parent.deletedAt ? offering.parent : null;
  const parentTr = parent ? pick(parent.translations, found.locale) : null;
  const demoHref = `/${found.locale}/request-demo?product=${encodeURIComponent(tr.slug)}`;
  const ctaLabel = tr.ctaLabel ?? t.requestDemo;

  const url = `${SITE_URL}/${found.locale}/products/${tr.slug}`;
  const enSlug = offering.translations.find((x) => x.locale === "en")?.slug ?? tr.slug;
  const ecoModule = moduleForSlug(enSlug);
  const [flagship, eco, ecoInDb] = await Promise.all([ecoModule ? getFlagshipData(found.locale) : null, getEcosystem(found.locale), ecosystemInDatabase()]);
  // This product's node in Admin → Ecosystem (what it receives and passes on).
  const ecoNode = eco.nodes.find((n) => n.product === offering.key)?.key ?? null;
  const showOmsPreview = offering.key === "trading-platform";
  const look = (offering.key && (await getDesign()).products[offering.key]) || null;
  // At a glance: who it is for, what it connects to in the market, where it is live.
  const marketLinks = ecoNode
    ? [...new Set(eco.edges.flatMap((e) => (e.from === ecoNode ? [e.to] : e.to === ecoNode ? [e.from] : [])))]
        .map((k) => eco.nodes.find((n) => n.key === k))
        .filter((n): n is NonNullable<typeof n> => !!n && n.layer === "MARKET")
        .map((n) => n.label)
    : [];
  const glance = [
    { label: t.glanceFor, value: targetUsers.length ? targetUsers.slice(0, 3).map((u) => u.title).join(", ") : null },
    { label: t.glanceConnects, value: marketLinks.length ? marketLinks.join(", ") : null },
    { label: t.glanceLive, value: offering.deployments.length ? fill(t.glanceLiveValue, { n: offering.deployments.length }) : null },
  ].filter((g): g is { label: string; value: string } => !!g.value);
  // In-page links to the sections this product has.
  const jump = [
    (capabilities.length > 0 || slots) && { id: "features", label: t.keyFeatures },
    (shots.length > 0 || slots) && { id: "screens", label: t.screensTitle },
    (demo || slots) && { id: "demo", label: t.demoTitle },
    steps.length > 1 && { id: "how", label: t.howItWorks },
    (ecoNode || ecoModule) && { id: "ecosystem", label: t.ecosystemShort },
    (offering.deployments.length > 0 || slots) && { id: "results", label: t.resultsTitle },
    faqs.length > 0 && { id: "faq", label: t.faq },
  ].filter((x): x is { id: string; label: string } => !!x);

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

      {/* Marks the page for the background: this product's icons and colour. */}
      <span hidden data-product-key={offering.key ?? undefined} />
      <div style={productVars(offering.key, look)}>

      {/* Hero */}
      <section className="relative -mt-20 overflow-hidden pt-20 md:-mt-24 md:pt-24">
        <div className="aurora" />
        <div className="grid-fade pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-6 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:py-10">
          <div className="flex flex-col gap-7">
            <nav aria-label={found.locale === "bn" ? "অবস্থান" : "Breadcrumb"} className="flex items-center gap-2 text-sm text-text-secondary" data-reveal>
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
            <span data-reveal>
              <ProductMark productKey={offering.key} look={look} logo={productLogo ? { url: productLogo.url, width: productLogo.width, height: productLogo.height } : null} name={tr.name} size="lg" />
            </span>
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
            {/* The product on web, tablet and phone: its screenshots once added, its illustration until then. */}
            <DeviceShowcase
              name={tr.name}
              productKey={offering.key}
              look={look}
              logo={productLogo ? { url: productLogo.url, width: productLogo.width, height: productLogo.height } : null}
              visual={visualFor(tr.slug, offering.type)}
              shots={[...(hero ? [{ url: hero.url, alt: hero.alt ?? tr.name, width: hero.width, height: hero.height }] : []), ...shots]}
            />
          </div>
        </div>
        {glance.length > 0 && (
          <dl data-reveal className="relative mx-auto grid w-full max-w-7xl gap-4 px-4 pb-8 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
            {glance.map((g) => (
              <div key={g.label} className="flex flex-col gap-1 border-l-2 border-[var(--p-to)] py-1 pl-4">
                <dt className="text-xs font-semibold text-text-secondary">{g.label}</dt>
                <dd className="font-display text-base leading-snug font-semibold text-text-primary">{g.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {jump.length > 2 && (
        <nav aria-label={t.onThisPage} className="sticky top-[calc(4.5rem+var(--ticker-h,0px))] z-20 border-y border-fg/[0.06] bg-ink-950/85 backdrop-blur-xl md:top-[calc(5.5rem+var(--ticker-h,0px))]">
          <ul className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 py-2 md:px-8 [scrollbar-width:none]">
            {jump.map((j) => (
              <li key={j.id} className="shrink-0">
                <a href={`#${j.id}`} className="inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold whitespace-nowrap text-text-secondary transition-colors hover:bg-fg/[0.06] hover:text-text-primary">
                  {j.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {(capabilities.length > 0 || slots) && (
        <Band id="features" title={t.keyFeatures} body={t.keyFeaturesBody}>
          <FeatureGrid
            items={capabilities.slice(0, 9)}
            extra={
              slots
                ? Array.from({ length: Math.max(0, (capabilities.length < 3 ? 3 : capabilities.length < 6 ? 6 : 0) - capabilities.length) }, (_, i) => (
                    <ContentSlot key={i} kind="feature" locale={found.locale} adminHref={`/admin/products/${offering.id}#items`} />
                  ))
                : []
            }
          />
        </Band>
      )}

      {(tr.problem || tr.solution) && (
        <Band id="overview">
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

      {(shots.length > 0 || slots) && (
        <Band id="screens" title={t.screensTitle} body={t.screensBody} alt>
          <Lightbox
            layout="grid"
            photos={shots}
            labels={{ open: t.openPhoto, close: t.close, prev: t.prevPhoto, next: t.nextPhoto, counter: t.photoCounter }}
            extra={
              slots
                ? // At least three tiles in all; the last empty one asks for a phone screen when there is none yet.
                  Array.from({ length: Math.max(0, 3 - shots.length) }, (_, i) => (
                    <ContentSlot
                      key={`s${i}`}
                      kind={i === 2 - shots.length && !shots.some((x) => x.device === "PHONE" || (x.width && x.height && x.height > x.width)) ? "phone" : "screen"}
                      locale={found.locale}
                      aspect="aspect-[16/10]"
                      adminHref={`/admin/products/${offering.id}#media`}
                    />
                  ))
                : []
            }
          />
        </Band>
      )}

      {demo && (
        <Band id="demo" title={t.demoTitle} body={t.demoBody}>
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
      {!demo && slots && (
        <Band id="demo" title={t.demoTitle} body={t.demoBody}>
          <div className="mx-auto w-full max-w-5xl">
            <DemoPlaceholder name={tr.name} locale={found.locale} adminHref={`/admin/products/${offering.id}#media`} />
          </div>
        </Band>
      )}

      {steps.length > 1 && (
        <Band id="how" title={t.automationTitle} body={t.automationBody} alt>
          <div data-reveal>
            <AutomationFlow
              steps={steps.map((s) => ({ id: s.id, title: s.title, body: s.body }))}
              productKey={offering.key}
              look={look}
              labels={{ running: t.automationRunning, done: t.automationDone, step: t.ecoTourStep, pause: t.ecoTourPause, play: t.ecoTourPlay }}
            />
          </div>
        </Band>
      )}


      {showOmsPreview && (
        <Band title={t.omsPreviewTitle} alt>
          <p data-reveal className="-mt-6 max-w-2xl text-lg text-text-secondary">{t.omsPreviewBody}</p>
          <div data-reveal>
            <OmsPreview labels={omsLabels(t)} />
          </div>
        </Band>
      )}

      {(ecoNode || (ecoModule && flagship)) && (
        <Band id="ecosystem" title={t.whereItFits} body={t.whereItFitsBody}>
          <div data-reveal className="glass flex flex-col gap-8 rounded-3xl p-5 md:p-8" style={productVars(offering.key, look)}>
            {ecoNode && (
              <EcosystemPosition
                graph={eco}
                nodeKey={ecoNode}
                name={tr.name}
                productKey={offering.key}
                look={look}
                logo={productLogo ? { url: productLogo.url, width: productLogo.width, height: productLogo.height } : null}
                labels={{
                  from: t.posFrom,
                  to: t.posTo,
                  none: t.posNone,
                  kinds: { DATA: t.posKindDATA, ORDER: t.posKindORDER, RISK: t.posKindRISK, ONBOARDING: t.posKindONBOARDING, OPERATIONS: t.posKindOPERATIONS },
                  layers: { MARKET: t.posLayerMARKET, PRODUCT: t.posLayerPRODUCT, INSTITUTION: t.posLayerINSTITUTION, USER: t.posLayerUSER, XFL: t.posLayerXFL },
                }}
              />
            )}
            {ecoModule && flagship && (
              <div className="flex flex-col gap-4 border-t border-fg/[0.08] pt-6">
                <h3 className="font-display text-lg font-semibold">{t.posMapTitle}</h3>
                <EcosystemMap labels={ecosystemLabels(t, found.locale)} logos={flagship.logos} modules={withEcosystem(ecosystemModules(flagship.offerings, found.locale), eco, ecoInDb)} emphasis={ecoModule} />
              </div>
            )}
          </div>
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
                <span className="font-mono text-xs text-cyan-300">{fill(t.layerShort, { n: i + 1 })}</span>
                <span className="font-display font-semibold">{l.title}</span>
                {l.body && <span className="text-sm text-text-secondary">{l.body}</span>}
              </li>
            ))}
          </ol>
        </Band>
      )}

      {integrations.length > 0 && (
        <Band title={t.integrations} alt>
          <ItemGrid items={integrations} marks={exchangeMarks(integrations, partyLogos, credentials)} />
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


      {(offering.deployments.length > 0 || slots) && (
        <Band id="results" title={t.resultsTitle} body={t.resultsBody} alt>
          {offering.deployments.length > 0 && <DeploymentList offering={offering} locale={found.locale} t={t} logos={deploymentLogos} />}
          {slots && (
            <ul className="grid gap-4 md:grid-cols-3">
              <li><ContentSlot kind="caseStudy" locale={found.locale} adminHref="/admin/case-studies/new" /></li>
              <li><ContentSlot kind="review" locale={found.locale} adminHref="/admin/testimonials/new" /></li>
              <li><ContentSlot kind="figure" locale={found.locale} title={t.figureSlotProduct} adminHref="/admin/figures" /></li>
            </ul>
          )}
        </Band>
      )}

      {faqs.length > 0 && (
        <Band id="faq" title={t.faq}>
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
      </div>
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

function Band({ id, title, body, alt, children }: { id?: string; title?: string; body?: string; alt?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-36", alt && "border-y border-fg/[0.06] bg-fg/[0.015]")}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-8 md:py-12">
        {title && <SectionHeader title={title} body={body} />}
        {children}
      </div>
    </section>
  );
}

type Mark = { logo?: { url: string; width: number | null; height: number | null }; badge?: string };

/** Integration items that are DSE or CSE get the exchange's logo and XFL's certification with it. */
function exchangeMarks(
  items: { id: string; en: string }[],
  logos: Partial<Record<string, { url: string; width: number | null; height: number | null }>>,
  credentials: { orgKey: string; title: string }[],
): Record<string, Mark> {
  const out: Record<string, Mark> = {};
  for (const i of items) {
    const key = /dhaka stock exchange|\bdse\b/i.test(i.en) ? "dse" : /chittagong stock exchange|chattogram stock exchange|\bcse\b/i.test(i.en) ? "cse" : null;
    if (!key) continue;
    out[i.id] = { logo: logos[key], badge: credentials.find((c) => c.orgKey === key)?.title };
  }
  return out;
}

function ItemGrid({ items, icon, marks }: { items: { id: string; title: string; body: string | null; icon: string | null }[]; icon?: string; marks?: Record<string, Mark> }) {
  return (
    <ul className={cn("grid gap-4", gridCols(items.length))}>
      {items.map((i, n) => (
        <li key={i.id} data-reveal style={{ "--d": n % 3 } as CSSProperties} className="spotlight glass flex flex-col gap-4 rounded-3xl p-6 md:p-7">
          {marks?.[i.id]?.logo ? (
            <span className="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 ring-1 ring-black/5">
              <Image src={marks[i.id]!.logo!.url} alt="" width={marks[i.id]!.logo!.width ?? 96} height={marks[i.id]!.logo!.height ?? 96} className="h-full w-full object-contain" />
            </span>
          ) : (
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-sky/25 to-brand-royal/20 text-accent">
              <Icon name={i.icon ?? icon ?? "check"} className="size-5" />
            </span>
          )}
          <h3 className="font-display text-lg font-semibold tracking-tight">{i.title}</h3>
          {marks?.[i.id]?.badge && (
            <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-market-up/40 bg-market-up/10 px-2.5 py-1 text-xs font-semibold text-market-up">
              <Icon name="check" className="size-3.5" />
              {marks[i.id]!.badge}
            </span>
          )}
          {i.body && <p className="text-sm leading-relaxed whitespace-pre-line text-text-secondary">{i.body}</p>}
        </li>
      ))}
    </ul>
  );
}

/** A fitting symbol for a feature without one chosen in the admin, from its English or Bangla words. */
function featureIcon(title: string): string {
  const t = title.toLowerCase();
  if (/chart|graph|চার্ট/.test(t)) return "chart";
  if (/depth|portfolio|balance|gain|loss|ডেপথ|পোর্টফোলিও|লাভ/.test(t)) return "chart";
  if (/order|trade|অর্ডার|লেনদেন/.test(t)) return "exchange";
  if (/watch|ওয়াচ/.test(t)) return "bolt";
  if (/news|sector|খবর/.test(t)) return "newspaper";
  if (/search|history|খোঁজ|পুরোনো/.test(t)) return "book";
  if (/keyboard|dashboard|desktop|ড্যাশবোর্ড|কিবোর্ড/.test(t)) return "cloud";
  if (/document|file|নথি/.test(t)) return "document";
  if (/kyc|identity|verify|যাচাই|পরিচয়/.test(t)) return "id";
  if (/risk|limit|secure|ঝুঁকি|সুরক্ষ/.test(t)) return "shield";
  if (/account|client|investor|অ্যাকাউন্ট|গ্রাহক/.test(t)) return "users";
  if (/settle|ledger|report|সেটেলমেন্ট|রিপোর্ট/.test(t)) return "briefcase";
  return "check";
}

/** Key features: the product's capabilities as a grid, numbered by order of importance. */
function FeatureGrid({ items, extra = [] }: { items: { id: string; title: string; body: string | null; icon: string | null }[]; extra?: React.ReactNode[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i, n) => (
        <li key={i.id} data-reveal style={{ "--d": n % 3 } as CSSProperties} className="feature-card flex gap-4 rounded-3xl border border-fg/[0.08] bg-fg/[0.02] p-5 md:p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--p-from,#1d4ed8)] to-[var(--p-to,#22bceb)] text-white shadow-[0_10px_24px_-12px_var(--p-to,#22bceb)]">
            <Icon name={i.icon ?? featureIcon(i.title)} className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col gap-1.5">
            <h3 className="font-display text-lg leading-snug font-semibold">{i.title}</h3>
            {i.body && <p className="text-sm leading-relaxed whitespace-pre-line text-text-secondary">{i.body}</p>}
          </span>
        </li>
      ))}
      {extra.map((node, k) => (
        <li key={`slot-${k}`}>{node}</li>
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

function DeploymentList({ offering, locale, t, logos }: { offering: Offering; locale: AppLocale; t: Messages; logos: Awaited<ReturnType<typeof mediaMap>> }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-display text-xl font-semibold">{t.deployments}</h3>
      <ul className={cn("grid gap-4", gridCols(offering.deployments.length))}>
        {offering.deployments.map((d) => {
          const live = d.organization && d.organization.status === "PUBLISHED" && !d.organization.deletedAt ? d.organization : null;
          const org = live ? pick(live.translations, locale) : null;
          const logo = live?.logoPermission && live.logoMediaId ? logos.get(live.logoMediaId) : undefined;
          return (
            <li key={d.id} data-reveal className="spotlight glass flex flex-col gap-3 rounded-3xl p-6">
              <span className="flex items-center gap-3">
                {logo && (
                  <span className="flex h-11 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-black/5">
                    <Image src={logo.url} alt="" width={logo.width ?? 120} height={logo.height ?? 60} className="h-full w-full object-contain" />
                  </span>
                )}
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-display text-lg font-semibold">{d.appName}</span>
                  {org && <span className="text-sm text-text-secondary">{org.name}</span>}
                </span>
              </span>
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
    </div>
  );
}

