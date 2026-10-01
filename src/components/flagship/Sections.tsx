import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { CountUp } from "@/components/motion/CountUp";
import { Icon } from "@/components/ui/Icon";
import type { AppLocale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils/cn";
import { EcosystemMap, type EcosystemLabels } from "./EcosystemMap";
import { CapabilityVisual, type VisualKind } from "./Visuals";

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

export function SectionHeader({
  eyebrow,
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
  return (
    <div className={cn("flex max-w-3xl flex-col gap-5", align === "center" && "mx-auto items-center text-center")}>
      {eyebrow && (
        <p className="eyebrow" data-reveal>
          {eyebrow}
        </p>
      )}
      <H
        data-reveal
        style={{ ...delay(1), fontStretch: "110%" }}
        className={cn(
          "font-display font-semibold tracking-[-0.03em] text-balance text-text-primary",
          H === "h1" ? "text-5xl leading-[1] md:text-[4.5rem]" : "text-[2.25rem] leading-[1.04] md:text-[3.25rem]",
        )}
      >
        {title}
      </H>
      {body && (
        <p data-reveal style={delay(2)} className="max-w-2xl text-lg leading-relaxed text-pretty text-text-secondary md:text-xl">
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
      className="inline-flex h-12 items-center gap-2 rounded-full border border-fg/15 bg-fg/[0.03] px-6 text-sm font-semibold text-text-primary backdrop-blur transition-colors duration-300 hover:border-brand-sky/60 hover:bg-brand-sky/10"
    >
      {children}
    </Link>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

export function ecosystemLabels(t: Messages): EcosystemLabels {
  return {
    caption: t.ecoCaption,
    aria: t.ecoAria,
    scenes: [t.ecoScene1, t.ecoScene2, t.ecoScene3, t.ecoScene4],
    sceneText: [t.ecoText1, t.ecoText2, t.ecoText3, t.ecoText4],
    hub: t.ecoHub,
    hubSub: t.ecoHubSub,
    roles: { bsec: t.roleBsec, dse: t.roleDse, cse: t.roleCse, cdbl: t.roleCdbl, bank: t.roleBank, investors: t.roleInvestors },
    names: { bank: t.nameBank, investors: t.nameInvestors },
  };
}

export function FlagshipHero({
  t,
  locale,
  body,
  memberCount,
  ticker,
  status,
}: {
  t: Messages;
  locale: AppLocale;
  body?: string | null;
  memberCount: number;
  /** Live price strip shown along the bottom edge of the hero. */
  ticker?: ReactNode;
  /** Live market status line above the headline (only when market data is on). */
  status?: ReactNode;
}) {
  return (
    <section className="hero-seq relative -mt-20 overflow-hidden pt-20 md:-mt-24 md:pt-24">
      <div className="relative mx-auto grid min-h-[calc(100svh-9rem)] w-full max-w-7xl items-center gap-12 px-4 pt-10 pb-16 md:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:pt-0">
        <div className="flex flex-col gap-8">
          {status && <div data-reveal>{status}</div>}
          <h1
            data-reveal
            style={{ ...delay(1), fontStretch: "104%" }}
            className="font-display text-[clamp(2.4rem,4.4vw,4.1rem)] leading-[1] font-semibold tracking-[-0.03em] text-balance text-text-primary"
          >
            {t.heroTitleA} {t.heroTitleB}
          </h1>
          <p data-reveal style={delay(2)} className="max-w-[34rem] text-lg leading-relaxed text-text-secondary md:text-xl">
            {body || t.heroBody}
          </p>
          <div data-reveal style={delay(3)} className="flex flex-wrap items-center gap-3">
            <PrimaryButton href={`/${locale}/request-demo`}>{t.requestDemo}</PrimaryButton>
            <GhostButton href={`/${locale}/platform`}>{t.explorePlatform}</GhostButton>
          </div>
          {memberCount > 0 && (
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
          <EcosystemMap labels={ecosystemLabels(t)} className="relative" />
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
export function capabilities(t: Messages, locale: AppLocale, publishedSlugs: Set<string>): Capability[] {
  return CAPABILITY_KEYS.map((c) => ({
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
  return (
    <ul className="bento grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((c, i) => (
        <li key={c.key} id={anchors ? c.key : undefined} data-reveal style={delay(i % 4)} className={cn("scroll-mt-32", SPAN[c.key])}>
          <Link
            href={c.href}
            className="spotlight group glass flex h-full flex-col overflow-hidden rounded-3xl p-6 transition-transform duration-500 hover:-translate-y-1"
          >
            <div className="flex-1">
              <CapabilityVisual kind={c.key} />
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-fg/10 bg-brand-sky/10 text-brand-sky">
                  <Icon name={c.icon} className="size-5" />
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold tracking-tight">{c.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{c.body}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ── Order flow story ─────────────────────────────────────────────────────────

export function FlowStory({ t }: { t: Messages }) {
  const steps = [
    { icon: "users", label: t.flowStep1, tag: t.p4Title },
    { icon: "exchange", label: t.flowStep2, tag: "OMS" },
    { icon: "shield", label: t.flowStep3, tag: "RMS" },
    { icon: "globe", label: t.flowStep4, tag: "DSE · CSE" },
    { icon: "chart", label: t.flowStep5, tag: t.capBackTitle },
  ];
  return (
    <div className="relative">
      {/* Connecting rail with travelling light */}
      <div aria-hidden="true" className="absolute top-12 right-[10%] left-[10%] hidden h-px bg-gradient-to-r from-transparent via-fg/15 to-transparent lg:block">
        <span
          className="absolute -top-[2px] h-[5px] w-24 rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
          style={{ animation: "lane 4.5s linear infinite" }}
        />
      </div>
      <ol className="relative grid gap-4 lg:grid-cols-5">
        {steps.map((s, i) => (
          <li key={s.tag} data-reveal style={delay(i)} className="flex flex-col items-center gap-4 text-center">
            <span className="glass relative flex size-24 items-center justify-center rounded-3xl text-brand-sky shadow-[0_0_60px_-20px_rgb(34_188_235/0.7)]">
              <Icon name={s.icon} className="size-8" />
              <span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-brand-royal font-mono text-xs text-white">
                {i + 1}
              </span>
            </span>
            <span className="text-sm font-semibold text-gold">{s.tag}</span>
            <p className="max-w-[16rem] text-sm leading-relaxed text-text-primary">{s.label}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Numbers ──────────────────────────────────────────────────────────────────

export function StatGrid({ items, locale }: { items: { value: number; label: string; suffix?: string }[]; locale: AppLocale }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-fg/10 bg-fg/10 lg:grid-cols-4">
      {items.map((s, i) => (
        <div key={s.label} data-reveal style={delay(i)} className="flex flex-col gap-2 bg-ink-950/90 p-6 md:p-8">
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
          <dt className="font-display text-xl font-semibold" style={{ fontStretch: "108%" }}>
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
        <li key={n} className="border-t border-fg/10 py-4 font-display text-lg leading-snug font-medium text-text-primary md:text-xl" style={{ fontStretch: "105%" }}>
          {n}
        </li>
      ))}
    </ul>
  );
}

// ── Closing call to action ───────────────────────────────────────────────────

export function CtaBand({ t, locale }: { t: Messages; locale: AppLocale }) {
  return (
    <Shell className="py-20 md:py-28">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-royal px-6 py-14 md:px-16 md:py-20">
        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="flex max-w-2xl flex-col gap-4">
            <h2 className="font-display text-4xl leading-[1.02] font-semibold tracking-[-0.03em] text-white md:text-6xl" style={{ fontStretch: "110%" }}>
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
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pt-16 pb-12 md:px-8 md:pt-24 md:pb-16">
        <SectionHeader as="h1" eyebrow={eyebrow} title={title} body={body} />
        {children}
      </div>
    </section>
  );
}
