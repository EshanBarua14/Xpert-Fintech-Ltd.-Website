import { Icon } from "@/components/ui/Icon";
import { OrderFlow } from "@/components/diagrams/OrderFlow";
import { EcosystemMap } from "@/components/flagship/EcosystemMap";
import { ecosystemLabels } from "@/components/flagship/Sections";
import { CountUp } from "@/components/motion/CountUp";
import { videoEmbedUrl } from "@/lib/public/text";
import { cn } from "@/lib/utils/cn";
import { BlockHeading, CARD, CtaButton, gridCols, MediaImage, Paragraphs, revealDelay, SmartLink } from "./Shared";
import { NetworkDiagram } from "./NetworkDiagram";
import { LeadFormSection } from "@/components/forms/LeadFormSection";
import { bool, str, type BlockContext, type BlockData } from "./types";

export function HeroBlock({ block, ctx, isFirst }: { block: BlockData; ctx: BlockContext; isFirst: boolean }) {
  const visual = str(block.props.visual, "network");
  const image = visual === "image" ? ctx.media.get(block.items[0]?.mediaId ?? "") : undefined;
  const secondaryLabel = str(ctx.locale === "bn" ? block.props.secondaryCtaLabelBn || block.props.secondaryCtaLabelEn : block.props.secondaryCtaLabelEn);
  return (
    <div className="grid items-center gap-12 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-12">
      <div className="flex flex-col gap-8">
        <BlockHeading text={block.text} as={isFirst ? "h1" : "h2"} />
        <div data-reveal style={revealDelay(3, 9)} className="flex flex-wrap gap-3">
          <CtaButton label={block.text.ctaLabel} href={block.text.ctaHref} locale={ctx.locale} />
          <CtaButton label={secondaryLabel || null} href={str(block.props.secondaryCtaHref)} locale={ctx.locale} variant="secondary" />
        </div>
      </div>
      {visual === "network" && (
        <div data-reveal style={revealDelay(2, 9)}>
          <EcosystemMap labels={ecosystemLabels(ctx.t, ctx.locale)} />
        </div>
      )}
      {image && (
        <div data-reveal style={revealDelay(2, 9)} className="glass overflow-hidden rounded-3xl p-2">
          <MediaImage media={image} priority={isFirst} className="rounded-2xl" />
        </div>
      )}
    </div>
  );
}

export function RichTextBlock({ block }: { block: BlockData }) {
  const wide = str(block.props.width) === "wide";
  return (
    <div className={cn("flex flex-col gap-8", wide ? "max-w-5xl" : "max-w-3xl")}>
      <BlockHeading text={block.text} />
      <div data-reveal>
        <Paragraphs text={block.text.body} className="text-lg md:text-xl" />
      </div>
    </div>
  );
}

/** "12", "1,200+", "99.9%" → counts up to the number, keeping the rest as text. */
function StatValue({ value, locale }: { value: string | null; locale: BlockContext["locale"] }) {
  const m = /^(\d[\d,]*)(.*)$/.exec((value ?? "").trim());
  if (!m) return <>{value}</>;
  const n = Number(m[1]!.replace(/,/g, ""));
  if (!Number.isFinite(n) || n > 1e9) return <>{value}</>;
  return <CountUp value={n} suffix={m[2]} locale={locale} />;
}

export function StatsBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  if (!block.items.length) return null;
  return (
    <div className="flex flex-col gap-12">
      <BlockHeading text={block.text} />
      <dl className={cn("grid gap-px overflow-hidden rounded-3xl border border-fg/10 bg-fg/10", gridCols[str(block.props.columns, "3")])}>
        {block.items.map((item, i) => {
          const source = str(item.props.sourceNote);
          return (
            <div key={item.id} data-reveal style={revealDelay(i, 4)} className="flex flex-col gap-2 bg-ink-950/90 p-6 md:p-8">
              <dt className="order-2 text-sm text-text-secondary">{item.title}</dt>
              <dd className="text-gradient-brand order-1 font-display text-5xl font-semibold tracking-tight md:text-6xl">
                <StatValue value={item.subtitle} locale={ctx.locale} />
              </dd>
              {source && (
                <p className="order-3 text-xs text-text-secondary/80">
                  {ctx.t.source}: {source}
                </p>
              )}
            </div>
          );
        })}
      </dl>
    </div>
  );
}

export function FeatureGridBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  return (
    <div className="flex flex-col gap-12">
      <BlockHeading text={block.text} />
      <ul className={cn("grid gap-4", gridCols[str(block.props.columns, "3")])}>
        {block.items.map((item, i) => {
          const image = ctx.media.get(item.mediaId ?? "");
          return (
            <li key={item.id} data-reveal style={revealDelay(i)} className={cn(CARD, "flex flex-col gap-4 transition-transform duration-500 hover:-translate-y-1")}>
              {image ? (
                <MediaImage media={image} className="rounded-2xl" sizes="(min-width: 1024px) 33vw, 100vw" />
              ) : (
                item.iconName && (
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-sky/25 to-brand-royal/20 text-cyan-300">
                    <Icon name={item.iconName} className="size-5" />
                  </span>
                )
              )}
              {item.title && <h3 className="font-display text-xl font-semibold tracking-tight">{item.title}</h3>}
              <Paragraphs text={item.body} className="text-sm" />
              {item.linkUrl && (
                <SmartLink href={item.linkUrl} locale={ctx.locale} className="mt-auto text-sm font-semibold text-brand-sky hover:text-fg">
                  {item.ctaLabel ?? ctx.t.readMore}
                </SmartLink>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ValuesBlock({ block }: { block: BlockData }) {
  return (
    <div className="flex flex-col gap-12">
      <BlockHeading text={block.text} />
      <ul className={cn("grid gap-4", gridCols[str(block.props.columns, "3")])}>
        {block.items.map((item, i) => (
          <li key={item.id} data-reveal style={revealDelay(i)} className={cn(CARD, "flex flex-col gap-3")}>
            <span className="font-mono text-xs text-cyan-300">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="font-display text-2xl font-semibold tracking-tight">{item.title}</h3>
            {item.body && <p className="text-sm leading-relaxed text-text-secondary">{item.body}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WorkflowBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  const steps = block.items
    .filter((i) => i.title)
    .map((i) => ({ key: i.id, label: i.title!, note: i.subtitle, highlight: bool(i.props.highlight) }));
  return (
    <div className="flex flex-col gap-12">
      <BlockHeading text={{ ...block.text, title: null }} />
      <div data-reveal className="glass rounded-3xl p-4 md:p-8">
        <OrderFlow steps={steps} title={block.text.title ?? ctx.t.howItWorks} caption={bool(block.props.conceptual, false) ? ctx.t.conceptualView : undefined} />
      </div>
    </div>
  );
}

export function NetworkBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  const nodes = block.items
    .filter((i) => i.title)
    .map((i) => ({ id: i.id, name: i.title!, detail: i.body, href: i.linkUrl }));
  if (nodes.length < 2) return null;
  return (
    <div className="flex flex-col gap-12">
      <BlockHeading text={block.text} />
      <div data-reveal>
        <NetworkDiagram
          nodes={nodes}
          locale={ctx.locale}
          hint={ctx.t.selectNode}
          caption={bool(block.props.conceptual, false) ? ctx.t.conceptualView : undefined}
          readMore={ctx.t.readMore}
        />
      </div>
    </div>
  );
}

export function TimelineBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  return (
    <div className="flex flex-col gap-12">
      <BlockHeading text={block.text} />
      <ol className="relative flex flex-col gap-6 pl-10">
        <span aria-hidden="true" className="absolute top-2 bottom-2 left-3 w-px bg-gradient-to-b from-cyan-300 via-brand-royal/60 to-transparent" />
        {block.items.map((item, i) => (
          <li key={item.id} data-reveal style={revealDelay(i, 4)} className={cn(CARD, "relative flex flex-col gap-2")}>
            <span
              aria-hidden="true"
              className="absolute top-8 -left-[34px] size-3 rounded-full bg-cyan-300 shadow-[0_0_0_4px_rgb(5_8_15),0_0_16px_rgb(103_232_249/0.8)]"
            />
            {item.subtitle && <p className="font-mono text-sm text-cyan-300">{item.subtitle}</p>}
            {item.title && <h3 className="font-display text-xl font-semibold tracking-tight">{item.title}</h3>}
            <Paragraphs text={item.body} className="text-sm" />
            {item.linkUrl && (
              <SmartLink href={item.linkUrl} locale={ctx.locale} className="text-sm font-semibold text-brand-sky hover:text-fg">
                {ctx.t.readMore}
              </SmartLink>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function FaqBlock({ block }: { block: BlockData }) {
  return (
    <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
      <BlockHeading text={block.text} />
      <div className="flex flex-col gap-3">
        {block.items.map((item, i) => (
          <details key={item.id} data-reveal style={revealDelay(i, 5)} className="group glass rounded-2xl px-6 py-5 open:border-brand-sky/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {item.title}
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full border border-fg/15 text-brand-sky transition-transform duration-300 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <Paragraphs text={item.body} className="mt-4 text-sm" />
          </details>
        ))}
      </div>
    </div>
  );
}

export function VideoBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  const src = videoEmbedUrl(str(block.props.url));
  if (!src) return null;
  return (
    <figure className="flex flex-col gap-6">
      <BlockHeading text={{ ...block.text, subtitle: null }} />
      <div data-reveal className="glass overflow-hidden rounded-3xl p-2">
        <div className="aspect-video overflow-hidden rounded-2xl">
          <iframe
            src={src}
            title={block.text.title ?? ctx.t.video}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full"
          />
        </div>
      </div>
      {block.text.subtitle && <figcaption className="text-sm text-text-secondary">{block.text.subtitle}</figcaption>}
    </figure>
  );
}

export function CtaBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  return (
    <div data-reveal className="beam relative overflow-hidden rounded-[2rem] border border-fg/10 bg-navy-900/60 px-6 py-14 md:px-14 md:py-20">
      <div className="aurora opacity-70" />
      <div className="grid-fade pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-2xl flex-col gap-4">
          {block.text.title && <h2 className="text-gradient font-display text-4xl font-semibold tracking-[-0.035em] text-balance md:text-5xl">{block.text.title}</h2>}
          {block.text.subtitle && <p className="text-lg text-text-secondary">{block.text.subtitle}</p>}
        </div>
        <CtaButton label={block.text.ctaLabel ?? ctx.t.requestDemo} href={block.text.ctaHref ?? "request-demo"} locale={ctx.locale} />
      </div>
    </div>
  );
}

export function LeadFormBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  const mode = str(block.props.form) === "contact" ? "contact" : "demo";
  return (
    <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
      <BlockHeading text={block.text} />
      <div data-reveal className="glass rounded-3xl p-6 md:p-10">
        <LeadFormSection mode={mode} locale={ctx.locale} />
      </div>
    </div>
  );
}
