import { Icon } from "@/components/ui/Icon";
import { OrderFlow } from "@/components/diagrams/OrderFlow";
import { MarketNetwork } from "@/components/diagrams/MarketNetwork";
import { videoEmbedUrl } from "@/lib/public/text";
import { cn } from "@/lib/utils/cn";
import { BlockHeading, CtaButton, gridCols, MediaImage, Paragraphs, SmartLink } from "./Shared";
import { NetworkDiagram } from "./NetworkDiagram";
import { LeadFormSection } from "@/components/forms/LeadFormSection";
import { bool, str, type BlockContext, type BlockData } from "./types";

export function HeroBlock({ block, ctx, isFirst }: { block: BlockData; ctx: BlockContext; isFirst: boolean }) {
  const visual = str(block.props.visual, "network");
  const image = visual === "image" ? ctx.media.get(block.items[0]?.mediaId ?? "") : undefined;
  const secondaryLabel = str(ctx.locale === "bn" ? block.props.secondaryCtaLabelBn || block.props.secondaryCtaLabelEn : block.props.secondaryCtaLabelEn);
  return (
    <div className="grid items-center gap-12 py-8 lg:grid-cols-[1.1fr_1fr] lg:py-16">
      <div className="flex flex-col gap-8">
        <BlockHeading text={block.text} as={isFirst ? "h1" : "h2"} />
        <div className="flex flex-wrap gap-3">
          <CtaButton label={block.text.ctaLabel} href={block.text.ctaHref} locale={ctx.locale} />
          <CtaButton label={secondaryLabel || null} href={str(block.props.secondaryCtaHref)} locale={ctx.locale} variant="secondary" />
        </div>
      </div>
      {visual === "network" && <MarketNetwork caption={ctx.t.conceptualView} />}
      {image && <MediaImage media={image} priority={isFirst} className="rounded-card" />}
    </div>
  );
}

export function RichTextBlock({ block }: { block: BlockData }) {
  const wide = str(block.props.width) === "wide";
  return (
    <div className={cn("flex flex-col gap-6", wide ? "max-w-5xl" : "max-w-3xl")}>
      <BlockHeading text={block.text} />
      <Paragraphs text={block.text.body} className="text-lg" />
    </div>
  );
}

export function StatsBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  if (!block.items.length) return null;
  return (
    <div className="flex flex-col gap-10">
      <BlockHeading text={block.text} />
      <dl className={cn("grid gap-6", gridCols[str(block.props.columns, "3")])}>
        {block.items.map((item) => {
          const source = str(item.props.sourceNote);
          return (
            <div key={item.id} className="flex flex-col gap-2 border-l-2 border-brand-sky/60 pl-5">
              <dt className="order-2 text-text-secondary">{item.title}</dt>
              <dd className="tabular order-1 text-4xl font-semibold md:text-5xl">{item.subtitle}</dd>
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
    <div className="flex flex-col gap-10">
      <BlockHeading text={block.text} />
      <ul className={cn("grid gap-6", gridCols[str(block.props.columns, "3")])}>
        {block.items.map((item) => {
          const image = ctx.media.get(item.mediaId ?? "");
          return (
            <li key={item.id} className="flex flex-col gap-4 rounded-card border border-white/10 bg-navy-900/50 p-6">
              {image ? <MediaImage media={image} className="rounded-control" sizes="(min-width: 1024px) 33vw, 100vw" /> : <Icon name={item.iconName} className="h-8 w-8 text-brand-sky" />}
              {item.title && <h3 className="font-display text-xl font-semibold">{item.title}</h3>}
              <Paragraphs text={item.body} className="text-sm" />
              {item.linkUrl && (
                <SmartLink href={item.linkUrl} locale={ctx.locale} className="mt-auto text-sm text-brand-sky hover:underline">
                  {item.ctaLabel ?? ctx.t.readMore} →
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
    <div className="flex flex-col gap-10">
      <BlockHeading text={block.text} />
      <ul className={cn("grid gap-px overflow-hidden rounded-card border border-white/10 bg-white/10", gridCols[str(block.props.columns, "3")])}>
        {block.items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 bg-ink-950 p-6">
            <h3 className="font-display text-lg font-semibold text-brand-sky">{item.title}</h3>
            {item.body && <p className="text-sm text-text-secondary">{item.body}</p>}
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
    <div className="flex flex-col gap-10">
      <BlockHeading text={{ ...block.text, title: null }} />
      <OrderFlow steps={steps} title={block.text.title ?? ctx.t.howItWorks} caption={bool(block.props.conceptual, true) ? ctx.t.conceptualView : undefined} />
    </div>
  );
}

export function NetworkBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  const nodes = block.items
    .filter((i) => i.title)
    .map((i) => ({ id: i.id, name: i.title!, detail: i.body, href: i.linkUrl }));
  if (nodes.length < 2) return null;
  return (
    <div className="flex flex-col gap-10">
      <BlockHeading text={block.text} />
      <NetworkDiagram
        nodes={nodes}
        locale={ctx.locale}
        hint={ctx.t.selectNode}
        caption={bool(block.props.conceptual, true) ? ctx.t.conceptualView : undefined}
        readMore={ctx.t.readMore}
      />
    </div>
  );
}

export function TimelineBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  return (
    <div className="flex flex-col gap-10">
      <BlockHeading text={block.text} />
      <ol className="relative flex flex-col gap-10 border-l border-white/15 pl-8">
        {block.items.map((item) => (
          <li key={item.id} className="relative flex flex-col gap-2">
            <span aria-hidden="true" className="absolute top-1.5 -left-[37px] h-2.5 w-2.5 rounded-full bg-brand-sky ring-4 ring-ink-950" />
            {item.subtitle && <p className="tabular text-sm text-brand-sky">{item.subtitle}</p>}
            {item.title && <h3 className="font-display text-xl font-semibold">{item.title}</h3>}
            <Paragraphs text={item.body} className="text-sm" />
            {item.linkUrl && (
              <SmartLink href={item.linkUrl} locale={ctx.locale} className="text-sm text-brand-sky hover:underline">
                {ctx.t.readMore} →
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
    <div className="flex max-w-3xl flex-col gap-8">
      <BlockHeading text={block.text} />
      <div className="divide-y divide-white/10 border-y border-white/10">
        {block.items.map((item) => (
          <details key={item.id} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {item.title}
              <span aria-hidden="true" className="text-brand-sky transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <Paragraphs text={item.body} className="mt-3 text-sm" />
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
    <figure className="flex flex-col gap-4">
      {block.text.title && <h2 className="font-display text-3xl font-semibold">{block.text.title}</h2>}
      <div className="aspect-video overflow-hidden rounded-card border border-white/10">
        <iframe
          src={src}
          title={block.text.title ?? ctx.t.video}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
        />
      </div>
      {block.text.subtitle && <figcaption className="text-sm text-text-secondary">{block.text.subtitle}</figcaption>}
    </figure>
  );
}

export function CtaBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  return (
    <div className="flex flex-col items-start gap-6 rounded-card border border-brand-sky/20 bg-gradient-to-br from-navy-800 to-ink-950 p-8 md:flex-row md:items-center md:justify-between md:p-12">
      <div className="flex max-w-2xl flex-col gap-3">
        {block.text.title && <h2 className="font-display text-3xl font-semibold text-balance">{block.text.title}</h2>}
        {block.text.subtitle && <p className="text-text-secondary">{block.text.subtitle}</p>}
      </div>
      <CtaButton label={block.text.ctaLabel ?? ctx.t.requestDemo} href={block.text.ctaHref ?? "request-demo"} locale={ctx.locale} />
    </div>
  );
}

/** Until the demo form ships (Phase 12), point people to the contact email. */
export function LeadFormBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  const mode = str(block.props.form) === "contact" ? "contact" : "demo";
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <BlockHeading text={block.text} />
      <LeadFormSection mode={mode} locale={ctx.locale} />
    </div>
  );
}
