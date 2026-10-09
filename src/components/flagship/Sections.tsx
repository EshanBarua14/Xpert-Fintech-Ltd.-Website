import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { CountUp } from "@/components/motion/CountUp";
import { Icon } from "@/components/ui/Icon";
import type { AppLocale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils/cn";
import { EcosystemMap, type EcosystemLabels, type EcosystemLogos, type EcosystemModuleInfo } from "./EcosystemMap";
import { EcosystemExplorer, type TourLabels } from "./EcosystemExplorer";
import type { EcoGraph } from "@/lib/public/ecosystem";
import { ECOSYSTEM_MODULES, type EcosystemModuleKey } from "./ecosystem-modules";
import { pick } from "@/lib/public/text";
import { CapabilityVisual, type VisualKind } from "./Visuals";
import { digits } from "@/lib/i18n/digits";

/**
 * Flagship sections shared by the home, platform, products and consortium
 * pages. Presentational only: pages load the data and pass it in.
 */

const delay = (d: number) => ({ "--d": d }) as CSSProperties;

export function Shell({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("relative scroll-mt-28", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">{children}</div>
    </section>
  );
}

/**
 * A section's title and its lead line, stacked: the lead sits directly under
 * the title, on the same left edge, at reading width, so the pair always
 * reads as one unit at every screen size. `eyebrow` is kept for callers but
 * not printed: headings stand alone.
 */
export function SectionHeader({
  title,
  body,
  align = "left",
  as: H = "h2",
}: {
  eyebrow?: string;
  title: string;
  body?: string | null;
  align?: "left" | "center";
  as?: "h1" | "h2";
}) {
  const centered = align === "center";
  return (
    <div className={cn("flex w-full flex-col gap-4", centered ? "mx-auto max-w-3xl items-center text-center" : "items-start text-left")}>
      <H
        data-reveal
        style={delay(0)}
        className={cn(
          "max-w-4xl font-display text-balance text-text-primary",
          H === "h1" ? "text-[2.6rem] leading-[1.04] md:text-[4rem]" : "text-[2.05rem] leading-[1.08] md:text-[2.85rem]",
        )}
      >
        {title}
      </H>
      {body && (
        <p data-reveal style={delay(1)} className="max-w-[44rem] text-[1.0625rem] leading-relaxed text-pretty text-text-secondary md:text-lg">
          {body}
        </p>
      )}
    </div>
  );
}

export function PrimaryButton({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "btn-glow group inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function GhostButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 shrink-0 whitespace-nowrap items-center gap-2 rounded-full border border-fg/15 bg-fg/[0.03] px-6 text-sm font-semibold text-text-primary backdrop-blur transition-colors duration-300 hover:border-brand-sky/60 hover:bg-brand-sky/10"
    >
      {children}
    </Link>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

export function ecosystemLabels(t: Messages, locale?: AppLocale): EcosystemLabels {
  return {
    caption: t.ecoCaption,
    aria: t.ecoAria,
    scenes: [t.ecoScene1, t.ecoScene2, t.ecoScene3, t.ecoScene4],
    sceneText: [t.ecoText1, t.ecoText2, t.ecoText3, t.ecoText4],
    hub: t.ecoHub,
    hubSub: t.ecoHubSub,
    roles: { bsec: t.roleBsec, dse: t.roleDse, cse: t.roleCse, cdbl: t.roleCdbl, bank: t.roleBank, investors: t.roleInvestors },
    names: { bank: t.nameBank, investors: t.nameInvestors, bsec: t.nameBsec, dse: t.nameDse, cse: t.nameCse, cdbl: t.nameCdbl },
    moduleNames: { "Back office": t.ecoModBackOffice },
    explore: t.exploreProduct,
    steps: [
      [t.ecoStep1a, t.ecoStep1b, t.ecoStep1c],
      [t.ecoStep2a, t.ecoStep2b, t.ecoStep2c],
      [t.ecoStep3a, t.ecoStep3b, t.ecoStep3c],
      [t.ecoStep4a, t.ecoStep4b],
    ],
    stepsLabel: t.ecoStepsLabel,
    digits: locale === "bn" ? "০১২৩৪৫৬৭৮৯" : undefined,
  };
}

/** Labels for the ecosystem tour and the phone layout. */
export function tourLabels(t: Messages): TourLabels {
  return {
    start: t.ecoTourStart,
    meta: t.ecoTourMeta,
    step: t.ecoTourStep,
    prev: t.ecoTourPrev,
    next: t.ecoTourNext,
    pause: t.ecoTourPause,
    play: t.ecoTourPlay,
    end: t.ecoTourEnd,
    replay: t.ecoTourReplay,
    worksWith: t.ecoWorksWith,
    explore: t.exploreProduct,
    close: t.close,
    layers: { MARKET: t.ecoLayerMarket, XFL: t.ecoLayerXfl, PRODUCT: t.ecoLayerProduct, INSTITUTION: t.ecoLayerInstitution, USER: t.ecoLayerUser },
  };
}

/** The ecosystem map with its tour and phone layout when the CMS has a graph; the map alone otherwise. */
export function Ecosystem({
  t,
  locale,
  modules,
  graph,
  focus,
  logos,
}: {
  t: Messages;
  locale?: AppLocale;
  modules?: Partial<Record<EcosystemModuleKey, EcosystemModuleInfo>>;
  graph?: EcoGraph;
  focus?: EcosystemModuleKey;
  /** Institution and brokerage logos (uploaded with permission in Admin → Organizations). */
  logos?: EcosystemLogos;
}) {
  const labels = ecosystemLabels(t, locale);
  if (graph && graph.nodes.length && !focus) return <EcosystemExplorer labels={labels} modules={modules} graph={graph} tour={tourLabels(t)} logos={logos} />;
  return <EcosystemMap labels={labels} modules={modules} focus={focus} logos={logos} className="relative" />;
}

/** Which product page each ecosystem module opens. */
const MODULE_SLUG: Record<EcosystemModuleKey, string> = {
  OMS: "trading-platform",
  RMS: "rms",
  BO: "bo-account-opening",
  "Back office": "back-office",
  eKYC: "ekyc",
  DMS: "dms",
};

type OfferingLike = { translations: { locale: string; slug: string; name: string; tagline: string | null }[] };

/**
 * Ecosystem modules from the published products: a module whose product is
 * not published (e.g. eKYC while pending) is hidden from the map, and each
 * visible module links to its product page with its tagline as the description.
 */
export function ecosystemModules(offerings: OfferingLike[], locale: AppLocale): Partial<Record<EcosystemModuleKey, EcosystemModuleInfo>> {
  const bySlug = new Map<string, OfferingLike>();
  for (const o of offerings) for (const tr of o.translations) if (tr.locale === "en") bySlug.set(tr.slug, o);
  const out: Partial<Record<EcosystemModuleKey, EcosystemModuleInfo>> = {};
  for (const key of ECOSYSTEM_MODULES) {
    const o = bySlug.get(MODULE_SLUG[key]);
    if (!o) {
      out[key] = { available: false };
      continue;
    }
    const tr = pick(o.translations, locale);
    const own = o.translations.find((x) => x.locale === locale);
    out[key] = {
      description: tr?.tagline ?? undefined,
      href: `/${own ? locale : "en"}/products/${(own ?? tr)?.slug ?? MODULE_SLUG[key]}`,
    };
  }
  return out;
}

/** The ecosystem module that represents a product slug, if any. */
export function moduleForSlug(slug: string): EcosystemModuleKey | undefined {
  return ECOSYSTEM_MODULES.find((k) => MODULE_SLUG[k] === slug) ?? INVESTOR_CHANNELS[slug];
}

/** Investor-facing products reach the market through the OMS: the map marks it on their pages. */
const INVESTOR_CHANNELS: Record<string, EcosystemModuleKey> = { ost: "OMS", "smart-stock": "OMS" };

export function FlagshipHero({
  t,
  locale,
  body,
  memberCount,
  ticker,
  status,
  market,
  modules,
  graph,
  facts,
  logos,
  credentials,
}: {
  t: Messages;
  locale: AppLocale;
  body?: string | null;
  memberCount: number;
  /** Up to three real figures shown under the buttons (members, live apps, institutions…). */
  facts?: { value: number; label: string }[];
  /** Which ecosystem modules to show and where they link (from published products). */
  modules?: Partial<Record<EcosystemModuleKey, EcosystemModuleInfo>>;
  /** Live price strip shown along the bottom edge of the hero. */
  ticker?: ReactNode;
  /** Live market status line above the headline (only when market data is on). */
  status?: ReactNode;
  /** Live DSE and CSE indices under the buttons (only when market data is on). */
  market?: ReactNode;
  /** Admin → Ecosystem graph: adds the guided tour and the phone layout. */
  graph?: EcoGraph;
  /** Institution and brokerage logos for the ecosystem map. */
  logos?: EcosystemLogos;
  /** Memberships and exchange certifications, shown in place of the member-count line. */
  credentials?: ReactNode;
}) {
  return (
    <section className="hero-seq relative -mt-20 overflow-hidden pt-20 md:-mt-24 md:pt-24">
      {/* Exactly one screen on desktop: the viewport less the header and the price ticker, with even room above and below. */}
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pt-14 pb-16 md:px-8 md:pt-16 lg:min-h-[calc(100svh-6rem-var(--ticker-h,0px))] lg:grid-cols-[1fr_1fr] lg:gap-10 lg:pt-[clamp(2.75rem,7svh,5.5rem)] lg:pb-[clamp(1.25rem,4svh,3rem)]">
        <div className="flex flex-col gap-8 lg:gap-[clamp(0.9rem,2.6svh,2rem)]">
          {status && <div data-reveal>{status}</div>}
          <h1
            data-reveal
            style={{ ...delay(1) }}
            className="font-display text-[clamp(2.4rem,min(4.4vw,7svh),4.6rem)] leading-[1.03] text-balance text-text-primary"
          >
            {t.heroTitleA} {t.heroTitleB}
          </h1>
          <p data-reveal style={delay(2)} className="max-w-[38rem] text-lg leading-relaxed text-text-secondary md:text-xl lg:text-[clamp(1rem,2.2svh,1.25rem)]">
            {body || t.heroBody}
          </p>
          <div data-reveal style={delay(3)} className="flex flex-wrap items-center gap-3">
            <PrimaryButton href={`/${locale}/request-demo`}>{t.requestDemo}</PrimaryButton>
            <GhostButton href={`/${locale}/platform`}>{t.explorePlatform}</GhostButton>
          </div>
          {market && (
            <div data-reveal style={delay(4)}>
              {market}
            </div>
          )}
          {facts && facts.length > 0 ? (
            <dl data-reveal style={delay(4)} className="mt-2 grid max-w-[34rem] grid-cols-3 border-t border-fg/10 pt-5">
              {facts.slice(0, 3).map((f, i) => (
                <div key={f.label} className={cn("flex flex-col gap-1", i > 0 && "border-l border-fg/10 pl-4 sm:pl-6")}>
                  <dt className="order-2 text-[0.8125rem] leading-snug text-text-secondary">{f.label}</dt>
                  <dd className="order-1 font-display text-3xl leading-none text-text-primary md:text-[2.5rem]">
                    <CountUp value={f.value} locale={locale} />
                  </dd>
                </div>
              ))}
            </dl>
          ) : credentials ? (
            <div data-reveal style={delay(4)}>
              {credentials}
            </div>
          ) : memberCount > 0 && (
            <Link
              href={`/${locale}/consortium`}
              data-reveal
              style={delay(4)}
              className="self-start text-sm text-text-secondary underline decoration-fg/20 underline-offset-4 transition-colors hover:text-fg hover:decoration-gold"
            >
              {t.trustLine.replace("{n}", new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(memberCount))}
            </Link>
          )}
        </div>
        <div data-reveal style={delay(2)} className="relative w-full">
          <Ecosystem t={t} locale={locale} modules={modules} graph={graph} logos={logos} />
        </div>
      </div>
      {ticker && <div className="relative">{ticker}</div>}
    </section>
  );
}

// ── Member strip ─────────────────────────────────────────────────────────────

export function MemberMarquee({ names, label }: { names: string[]; label: string }) {
  if (names.length === 0) return null;
  const loop = [...names, ...names];
  return (
    <section aria-label={label} className="relative border-y border-fg/[0.06] bg-fg/[0.015] py-6">
      <p className="sr-only">{names.join(", ")}</p>
      <div className="marquee overflow-hidden" aria-hidden="true">
        <ul className="marquee-track gap-3">
          {loop.map((name, i) => (
            <li
              key={`${name}-${i}`}
              className="flex items-center gap-3 rounded-full border border-fg/10 bg-fg/[0.03] px-5 py-2.5 text-sm whitespace-nowrap text-text-secondary"
            >
              <span className="size-1.5 rounded-full bg-brand-sky" />
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Capabilities bento ───────────────────────────────────────────────────────

export type Capability = { key: VisualKind; icon: string; title: string; body: string; href: string };

const CAPABILITY_KEYS: { key: VisualKind; icon: string; title: keyof Messages; body: keyof Messages; slug: string }[] = [
  { key: "trading", icon: "exchange", title: "capTradingTitle", body: "capTradingBody", slug: "trading-platform" },
  { key: "risk", icon: "shield", title: "capRiskTitle", body: "capRiskBody", slug: "rms" },
  { key: "ekyc", icon: "id", title: "capEkycTitle", body: "capEkycBody", slug: "ekyc" },
  { key: "bo", icon: "users", title: "capBoTitle", body: "capBoBody", slug: "bo-account-opening" },
  { key: "dms", icon: "document", title: "capDmsTitle", body: "capDmsBody", slug: "dms" },
  { key: "back", icon: "chart", title: "capBackTitle", body: "capBackBody", slug: "back-office" },
  { key: "data", icon: "globe", title: "capDataTitle", body: "capDataBody", slug: "market-data" },
];

/** The seven capabilities; each links to its product page once published, else to the platform page. */
/** Capabilities shown only once their product is published (pending products stay off the site). */
const HIDE_UNTIL_PUBLISHED = new Set(["ekyc", "rms", "market-data"]);

export function capabilities(t: Messages, locale: AppLocale, publishedSlugs: Set<string>): Capability[] {
  return CAPABILITY_KEYS.filter((c) => !HIDE_UNTIL_PUBLISHED.has(c.slug) || publishedSlugs.has(c.slug)).map((c) => ({
    key: c.key,
    icon: c.icon,
    title: t[c.title],
    body: t[c.body],
    href: publishedSlugs.has(c.slug) ? `/${locale}/products/${c.slug}` : `/${locale}/platform#${c.key}`,
  }));
}

const SPAN: Record<VisualKind, string> = {
  trading: "lg:col-span-2 lg:row-span-2",
  risk: "lg:col-span-2",
  ekyc: "",
  bo: "",
  dms: "",
  back: "",
  data: "lg:col-span-2",
};

export function CapabilityBento({ items, anchors = false }: { items: Capability[]; anchors?: boolean }) {
  // With six cards (eKYC hidden), widen the back-office card so the last row has no gap.
  const span = (k: VisualKind) => (k === "back" && items.length === 6 ? "lg:col-span-2" : SPAN[k]);
  return (
    <ul className="bento grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((c, i) => (
        <li key={c.key} id={anchors ? c.key : undefined} data-reveal style={delay(i % 4)} className={cn("scroll-mt-32", span(c.key))}>
          <Link
            href={c.href}
            className="spotlight group glass flex h-full flex-col overflow-hidden rounded-3xl p-5 transition-transform duration-500 hover:-translate-y-1 sm:p-6"
          >
            <div className="flex-1">
              <CapabilityVisual kind={c.key} />
            </div>
            <div className="mt-4 flex flex-col gap-2.5 sm:mt-5 sm:gap-3">
              {/* Phones: icon beside the title to keep six cards short; larger screens: icon above. */}
              <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-fg/10 bg-brand-sky/10 text-brand-sky">
                  <Icon name={c.icon} className="size-5" />
                </span>
                <h3 className="font-display text-lg font-semibold tracking-tight">{c.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">{c.body}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ── Order flow story ─────────────────────────────────────────────────────────

type FlowLogo = { url: string; width: number | null; height: number | null };
type FlowProductInfo = { name: string; href: string; logo: FlowLogo | null };

/** The journey, in order, and which products do each step (by product key). */
const FLOW: { keys: string[]; icon: string; text: keyof Messages; exchanges?: boolean }[] = [
  { keys: ["bo-account-opening", "ekyc"], icon: "users", text: "flowStepOpen" },
  { keys: ["dms"], icon: "document", text: "flowStepDocs" },
  { keys: ["ost", "smart-stock"], icon: "globe", text: "flowStepTrade" },
  { keys: ["trading-platform"], icon: "exchange", text: "flowStep2" },
  // The exchanges are not an Xpert product: this step always shows, with the DSE and CSE logos.
  { keys: [], icon: "network", text: "flowStep4", exchanges: true },
  { keys: ["back-office"], icon: "chart", text: "flowStep5" },
];

/**
 * An order's journey through every published Xpert product, from account
 * opening to settlement. Each step names (and links to) the products doing
 * it, with the product's logo when one is set; the exchange step shows the
 * DSE and CSE logos. Without product data it falls back to the short
 * five-step version.
 */
export function FlowStory({
  t,
  products,
  exchanges,
}: {
  t: Messages;
  products?: Record<string, FlowProductInfo>;
  exchanges?: { DSE?: FlowLogo; CSE?: FlowLogo };
}) {
  const steps = products && Object.keys(products).length
    ? FLOW.map((f) => ({ ...f, items: f.keys.map((k) => products[k]).filter((p): p is FlowProductInfo => Boolean(p)) })).filter((f) => f.items.length || f.exchanges)
    : [];
  if (!steps.length) return <FlowStoryShort t={t} />;
  const cols = steps.length >= 7 ? "lg:grid-cols-4 xl:grid-cols-7" : steps.length === 6 ? "lg:grid-cols-3 xl:grid-cols-6" : "lg:grid-cols-5";
  return (
    <div className="relative">
      {/* Connecting rail with travelling light (wide screens, one row) */}
      <div aria-hidden="true" className="absolute top-10 right-[6%] left-[6%] hidden h-px bg-gradient-to-r from-transparent via-fg/15 to-transparent xl:block">
        <span className="absolute -top-[2px] h-[5px] w-24 rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent" style={{ animation: "lane 6s linear infinite" }} />
      </div>
      <ol className={cn("relative grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3", cols)}>
        {steps.map((s, i) => {
          const logos = s.exchanges ? [exchanges?.DSE, exchanges?.CSE].filter((l): l is FlowLogo => Boolean(l)) : [];
          const productLogo = s.items.find((p) => p.logo)?.logo;
          return (
            <li key={s.keys[0] ?? s.text} data-reveal style={delay(i % 7)} className="flex flex-col items-center gap-3 text-center">
              <span className="glass relative flex size-20 items-center justify-center rounded-3xl text-brand-sky shadow-[0_0_60px_-20px_rgb(34_188_235/0.7)]">
                {logos.length ? (
                  <span className="flex gap-1.5">
                    {logos.map((l) => (
                      <span key={l.url} className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5 ring-1 ring-black/5">
                        <Image src={l.url} alt="" width={l.width ?? 64} height={l.height ?? 64} className="h-full w-full object-contain" />
                      </span>
                    ))}
                  </span>
                ) : productLogo ? (
                  <span className="flex size-12 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-black/5">
                    <Image src={productLogo.url} alt="" width={productLogo.width ?? 96} height={productLogo.height ?? 96} className="h-full w-full object-contain" />
                  </span>
                ) : (
                  <Icon name={s.icon} className="size-7" />
                )}
                <span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-brand-royal font-mono text-xs text-white">{digits(i + 1, /[\u0980-\u09FF]/.test(t.home))}</span>
              </span>
              <span className="flex flex-col items-center gap-0.5">
                {s.exchanges && !s.items.length && <span className="text-sm font-semibold leading-snug text-gold">DSE · CSE</span>}
                {s.items.map((p) => (
                  <Link key={p.href} href={p.href} className="text-sm font-semibold leading-snug text-gold underline-offset-4 hover:underline">
                    {p.name}
                  </Link>
                ))}
              </span>
              <p className="max-w-[13rem] text-sm leading-relaxed text-text-primary">{t[s.text]}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function FlowStoryShort({ t }: { t: Messages }) {
  const steps = [
    { icon: "users", label: t.flowStep1, tag: t.p4Title },
    { icon: "exchange", label: t.flowStep2, tag: "OMS" },
    { icon: "globe", label: t.flowStep4, tag: "DSE · CSE" },
    { icon: "chart", label: t.flowStep5, tag: t.capBackTitle },
  ];
  return (
    <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.tag} data-reveal style={delay(i)} className="flex flex-col items-center gap-4 text-center">
          <span className="glass relative flex size-24 items-center justify-center rounded-3xl text-brand-sky">
            <Icon name={s.icon} className="size-8" />
            <span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-brand-royal font-mono text-xs text-white">{digits(i + 1, /[\u0980-\u09FF]/.test(t.home))}</span>
          </span>
          <span className="text-sm font-semibold text-gold">{s.tag}</span>
          <p className="max-w-[16rem] text-sm leading-relaxed text-text-primary">{s.label}</p>
        </li>
      ))}
    </ol>
  );
}

// ── Numbers ──────────────────────────────────────────────────────────────────

const LG_COLS: Record<number, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" };

export function StatGrid({ items, locale }: { items: { value: number; label: string; suffix?: string }[]; locale: AppLocale }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-fg/10 bg-fg/10", LG_COLS[items.length] ?? "lg:grid-cols-4")}>
      {items.map((s, i) => (
        <div
          key={s.label}
          data-reveal
          style={delay(i)}
          // An odd last tile spans both columns on phones, so the grid has no hole.
          className={cn("flex flex-col gap-2 bg-ink-950/90 p-6 md:p-8", items.length % 2 === 1 && i === items.length - 1 && "col-span-2 lg:col-span-1")}
        >
          <dt className="order-2 text-sm text-text-secondary">{s.label}</dt>
          <dd className="text-gradient-brand order-1 font-display text-5xl font-semibold tracking-tight md:text-6xl">
            <CountUp value={s.value} suffix={s.suffix} locale={locale} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ── Principles ───────────────────────────────────────────────────────────────

export function Principles({ t }: { t: Messages }) {
  const items = [
    { title: t.p1Title, body: t.p1Body },
    { title: t.p2Title, body: t.p2Body },
    { title: t.p3Title, body: t.p3Body },
    { title: t.p4Title, body: t.p4Body },
  ];
  return (
    <dl className="grid gap-x-16 gap-y-10 sm:grid-cols-2">
      {items.map((p) => (
        <div key={p.title} className="flex flex-col gap-2 border-l-2 border-gold/60 pl-6">
          <dt className="font-display text-xl font-semibold">
            {p.title}
          </dt>
          <dd className="max-w-md leading-relaxed text-text-secondary">{p.body}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The member brokerage houses as a list of names, like an honours board. */
export function MemberBoard({ names }: { names: string[] }) {
  return (
    <ul className="grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
      {names.map((n) => (
        <li key={n} className="border-t border-fg/10 py-4 font-display text-lg leading-snug font-medium text-text-primary md:text-xl">
          {n}
        </li>
      ))}
    </ul>
  );
}

// ── Closing call to action ───────────────────────────────────────────────────

export function CtaBand({ t, locale }: { t: Messages; locale: AppLocale }) {
  return (
    <Shell className="py-14 md:py-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-royal px-6 py-14 md:px-16 md:py-20">
        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="flex max-w-2xl flex-col gap-4">
            <h2 className="font-display text-4xl leading-[1.02] font-semibold tracking-[-0.03em] text-white md:text-6xl">
              {t.ctaTitle}
            </h2>
            <p className="text-lg text-white/80">{t.ctaBody}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}/request-demo`}
              className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-brand-deep transition-transform duration-300 hover:-translate-y-0.5"
            >
              {t.requestDemo}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex h-12 items-center rounded-full border border-white/40 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t.talkToUs}
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ── Page intro for inner pages ───────────────────────────────────────────────

export function PageHero({ eyebrow, title, body, children }: { eyebrow?: string; title: string; body?: string | null; children?: ReactNode }) {
  return (
    <section className="hero-seq relative -mt-20 overflow-hidden pt-20 md:-mt-24 md:pt-24">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8">
        <SectionHeader as="h1" eyebrow={eyebrow} title={title} body={body} />
        {children}
      </div>
    </section>
  );
}
