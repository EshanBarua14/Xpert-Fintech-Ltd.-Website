import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { OrderFlow } from "@/components/diagrams/OrderFlow";
import { ProductCard } from "@/components/products/ProductCard";
import { MediaImage, Paragraphs } from "@/components/blocks/Shared";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages, type Messages } from "@/lib/i18n/messages";
import { getOfferingBySlug, getSeo, mediaMap } from "@/lib/public/content";
import { breadcrumbLd, buildMetadata, JsonLd, SITE_URL } from "@/lib/public/seo";
import { pick, videoEmbedUrl } from "@/lib/public/text";

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

type ItemKind = Offering["items"][number]["kind"];

function itemsOf(offering: Offering, kind: ItemKind, locale: AppLocale) {
  return offering.items
    .filter((i) => i.kind === kind)
    .map((i) => ({ id: i.id, icon: i.iconName, ...(pick(i.translations, locale) ?? { title: "", body: null }) }))
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
    [offering.heroMediaId, ...offering.media.map((m) => m.mediaId), ...offering.items.map((i) => i.mediaId)],
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
  const videos = offering.media.filter((m) => m.kind === "VIDEO" && videoEmbedUrl(m.videoUrl));
  const parent = offering.parent && offering.parent.status === "PUBLISHED" && !offering.parent.deletedAt ? offering.parent : null;
  const parentTr = parent ? pick(parent.translations, found.locale) : null;
  const demoHref = `/${found.locale}/request-demo?product=${encodeURIComponent(tr.slug)}`;
  const ctaLabel = tr.ctaLabel ?? t.requestDemo;

  const url = `${SITE_URL}/${found.locale}/products/${tr.slug}`;

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
      <section className="bg-grid">
        <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="flex flex-col gap-6">
            <nav aria-label="Breadcrumb" className="text-sm text-text-secondary">
              <Link href={`/${found.locale}/products`} className="hover:text-brand-sky">
                {t.products}
              </Link>
              {parent && parentTr && (
                <>
                  {" / "}
                  <Link href={`/${found.locale}/products/${parentTr.slug}`} className="hover:text-brand-sky">
                    {parentTr.name}
                  </Link>
                </>
              )}
            </nav>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-balance md:text-6xl">{tr.name}</h1>
            {tr.tagline && <p className="text-xl text-text-secondary">{tr.tagline}</p>}
            <Paragraphs text={tr.summary} />
            {offering.showDemoCta && (
              <div className="flex flex-wrap gap-3">
                <ButtonLink href={demoHref} size="lg">
                  {ctaLabel}
                </ButtonLink>
              </div>
            )}
          </div>
          {hero && <MediaImage media={hero} priority className="rounded-card border border-white/10" />}
        </Container>
      </section>

      {(tr.problem || tr.solution) && (
        <Band>
          <div className="grid gap-10 md:grid-cols-2">
            {tr.problem && (
              <div className="flex flex-col gap-4">
                <h2 className="tabular text-xs tracking-[0.2em] text-brand-sky uppercase">{t.theProblem}</h2>
                <Paragraphs text={tr.problem} className="text-lg" />
              </div>
            )}
            {tr.solution && (
              <div className="flex flex-col gap-4">
                <h2 className="tabular text-xs tracking-[0.2em] text-brand-sky uppercase">{t.theSolution}</h2>
                <Paragraphs text={tr.solution} className="text-lg" />
              </div>
            )}
          </div>
        </Band>
      )}

      {capabilities.length > 0 && (
        <Band title={t.capabilities} alt>
          <ItemGrid items={capabilities} />
        </Band>
      )}

      {steps.length > 1 && (
        <Band>
          <OrderFlow
            title={t.howItWorks}
            caption={t.conceptualView}
            steps={steps.map((s, i) => ({ key: s.id, label: s.title, note: s.body, highlight: i === 0 }))}
          />
        </Band>
      )}

      {(screenshots.length > 0 || videos.length > 0) && (
        <Band title={t.screenshots} alt>
          <div className="grid gap-6 md:grid-cols-2">
            {screenshots.map((m) => {
              const caption = pick(m.translations, found.locale)?.caption;
              return (
                <figure key={m.id} className="flex flex-col gap-2">
                  <MediaImage media={images.get(m.mediaId!)} className="rounded-card border border-white/10" />
                  {(caption || m.isConceptual) && (
                    <figcaption className="text-sm text-text-secondary">
                      {caption}
                      {m.isConceptual && <Badge className="ml-2">{t.conceptualPrototype}</Badge>}
                    </figcaption>
                  )}
                </figure>
              );
            })}
            {videos.map((m) => (
              <div key={m.id} className="aspect-video overflow-hidden rounded-card border border-white/10">
                <iframe
                  src={videoEmbedUrl(m.videoUrl)!}
                  title={pick(m.translations, found.locale)?.caption ?? `${tr.name} — ${t.video}`}
                  loading="lazy"
                  allow="encrypted-media; picture-in-picture; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="h-full w-full"
                />
              </div>
            ))}
          </div>
        </Band>
      )}

      {layers.length > 0 && (
        <Band title={t.architecture}>
          <ol className="flex flex-col gap-2">
            {layers.map((l) => (
              <li key={l.id} className="grid gap-2 rounded-card border border-white/10 bg-navy-900/50 p-5 md:grid-cols-[240px_1fr]">
                <span className="font-semibold">{l.title}</span>
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
          <div className="grid gap-12 md:grid-cols-2">
            {useCases.length > 0 && (
              <div className="flex flex-col gap-6">
                <h2 className="font-display text-2xl font-semibold">{t.useCases}</h2>
                <ItemList items={useCases} />
              </div>
            )}
            {(targetUsers.length > 0 || tr.targetCustomers) && (
              <div className="flex flex-col gap-6">
                <h2 className="font-display text-2xl font-semibold">{t.whoItsFor}</h2>
                {tr.targetCustomers && <p className="text-text-secondary">{tr.targetCustomers}</p>}
                <ItemList items={targetUsers} />
              </div>
            )}
          </div>
        </Band>
      )}

      {offering.children.length > 0 && (
        <Band title={t.modules}>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offering.children.map((c) => (
              <li key={c.id}>
                <ProductCard offering={c} locale={found.locale} t={t} />
              </li>
            ))}
          </ul>
        </Band>
      )}

      {offering.deployments.length > 0 && <Deployments offering={offering} locale={found.locale} t={t} />}

      {faqs.length > 0 && (
        <Band title={t.faq}>
          <div className="max-w-3xl divide-y divide-white/10 border-y border-white/10">
            {faqs.map((f) => (
              <details key={f.id} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.title}
                  <span aria-hidden="true" className="text-brand-sky transition-transform group-open:rotate-45">
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
          <div className="flex flex-col items-start gap-6 rounded-card border border-brand-sky/20 bg-gradient-to-br from-navy-800 to-ink-950 p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <h2 className="font-display text-3xl font-semibold text-balance">{tr.name}</h2>
            <ButtonLink href={demoHref} size="lg">
              {ctaLabel}
            </ButtonLink>
          </div>
        </Band>
      )}
    </>
  );
}

function Band({ title, alt, children }: { title?: string; alt?: boolean; children: React.ReactNode }) {
  return (
    <section className={alt ? "bg-navy-900" : undefined}>
      <Container className="flex flex-col gap-10 py-16 md:py-20">
        {title && <SectionHeading title={title} />}
        {children}
      </Container>
    </section>
  );
}

function ItemGrid({ items, icon }: { items: { id: string; title: string; body: string | null; icon: string | null }[]; icon?: string }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <li key={i.id} className="flex flex-col gap-3 rounded-card border border-white/10 bg-ink-950/60 p-6">
          <Icon name={i.icon ?? icon} className="h-7 w-7 text-brand-sky" />
          <h3 className="font-semibold">{i.title}</h3>
          {i.body && <p className="text-sm whitespace-pre-line text-text-secondary">{i.body}</p>}
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
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offering.deployments.map((d) => {
          const org = d.organization && d.organization.status === "PUBLISHED" && !d.organization.deletedAt ? pick(d.organization.translations, locale) : null;
          return (
            <li key={d.id} className="flex flex-col gap-3 rounded-card border border-white/10 bg-ink-950/60 p-5">
              <span className="font-semibold">{d.appName}</span>
              {org && <span className="text-sm text-text-secondary">{org.name}</span>}
              <span className="mt-auto flex flex-wrap gap-3 text-sm">
                {d.playStoreUrl && (
                  <a href={d.playStoreUrl} target="_blank" rel="noopener noreferrer" className="text-brand-sky hover:underline">
                    {t.getAndroidApp} ↗
                  </a>
                )}
                {d.appStoreUrl && (
                  <a href={d.appStoreUrl} target="_blank" rel="noopener noreferrer" className="text-brand-sky hover:underline">
                    {t.getIosApp} ↗
                  </a>
                )}
                {d.webUrl && (
                  <a href={d.webUrl} target="_blank" rel="noopener noreferrer" className="text-brand-sky hover:underline">
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
