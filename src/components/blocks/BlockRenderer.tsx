import { cn } from "@/lib/utils/cn";
import type { PublicSection } from "@/lib/public/blocks";
import {
  CtaBlock,
  FaqBlock,
  FeatureGridBlock,
  HeroBlock,
  LeadFormBlock,
  NetworkBlock,
  RichTextBlock,
  StatsBlock,
  TimelineBlock,
  ValuesBlock,
  VideoBlock,
  WorkflowBlock,
} from "./ContentBlocks";
import { EventListBlock, LogoCloudBlock, PeopleListBlock, ProductGridBlock } from "./DataBlocks";
import type { BlockContext, BlockData } from "./types";

/**
 * Safe block renderer: the block's `type` picks a component from this fixed
 * list. Content never supplies code or HTML; unknown types render nothing.
 */
function Block({ block, ctx, isFirst }: { block: BlockData; ctx: BlockContext; isFirst: boolean }) {
  switch (block.type) {
    case "HERO":
      return <HeroBlock block={block} ctx={ctx} isFirst={isFirst} />;
    case "RICH_TEXT":
      return <RichTextBlock block={block} />;
    case "STATS":
      return <StatsBlock block={block} ctx={ctx} />;
    case "PRODUCT_GRID":
      return <ProductGridBlock block={block} ctx={ctx} />;
    case "FEATURE_GRID":
      return <FeatureGridBlock block={block} ctx={ctx} />;
    case "VALUES":
      return <ValuesBlock block={block} />;
    case "WORKFLOW":
      return <WorkflowBlock block={block} ctx={ctx} />;
    case "NETWORK_DIAGRAM":
      return <NetworkBlock block={block} ctx={ctx} />;
    case "TIMELINE":
      return <TimelineBlock block={block} ctx={ctx} />;
    case "LOGO_CLOUD":
      return <LogoCloudBlock block={block} ctx={ctx} />;
    case "PEOPLE_LIST":
      return <PeopleListBlock block={block} ctx={ctx} />;
    case "EVENT_LIST":
      return <EventListBlock block={block} ctx={ctx} />;
    case "FAQ":
      return <FaqBlock block={block} />;
    case "VIDEO":
      return <VideoBlock block={block} ctx={ctx} />;
    case "CTA":
      return <CtaBlock block={block} ctx={ctx} />;
    case "LEAD_FORM":
      return <LeadFormBlock block={block} ctx={ctx} />;
    default:
      return null;
  }
}

const VARIANT: Record<string, string> = {
  dark: "",
  grid: "",
  // Stored as "light" for compatibility; shown in the admin as "Navy (alternate)".
  light: "border-y border-white/[0.06] bg-white/[0.015]",
  "full-bleed": "",
};

export function Sections({ sections, ctx }: { sections: PublicSection[]; ctx: BlockContext }) {
  let first = true;
  return (
    <>
      {sections.map((section, index) => {
        // A page that opens with a hero gets the full-bleed lit backdrop behind the header.
        const heroFirst = index === 0 && section.blocks[0]?.type === "HERO";
        return (
          <section
            key={section.id}
            id={section.anchorId ?? undefined}
            className={cn("relative scroll-mt-28", VARIANT[section.variant], heroFirst && "-mt-20 overflow-hidden pt-20 md:-mt-24 md:pt-24")}
          >
            {heroFirst && <div className="aurora" />}
            {(heroFirst || section.variant === "grid") && <div className="grid-fade pointer-events-none absolute inset-0" />}
            <div
              className={cn(
                "relative mx-auto flex w-full flex-col gap-16 px-4 py-16 md:px-8 md:py-24",
                section.variant === "full-bleed" ? "max-w-none" : "max-w-7xl",
              )}
            >
              {section.blocks.map((block) => {
                const isFirst = first;
                first = false;
                return <Block key={block.id} block={block} ctx={ctx} isFirst={isFirst} />;
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
