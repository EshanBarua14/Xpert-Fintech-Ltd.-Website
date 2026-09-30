import "server-only";
import type { AppLocale } from "@/lib/i18n/config";
import type { PublicPage } from "./content";
import type { BlockData, BlockText, CardData } from "@/components/blocks/types";

type Tr = Record<string, unknown> & { locale: string };

/** Field-by-field: the page language first, English when a field is empty. */
function field(rows: Tr[], locale: AppLocale, key: string): string | null {
  const own = rows.find((r) => r.locale === locale)?.[key];
  if (typeof own === "string" && own) return own;
  const en = rows.find((r) => r.locale === "en")?.[key];
  return typeof en === "string" && en ? en : null;
}

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export type PublicSection = { id: string; variant: string; anchorId: string | null; blocks: BlockData[] };

/** Flattens a published page into sections of render-ready blocks. */
export function toSections(page: PublicPage, locale: AppLocale): PublicSection[] {
  return page.sections
    .map((s) => ({
      id: s.id,
      variant: s.variant,
      anchorId: s.anchorId,
      blocks: s.blocks.map((b): BlockData => {
        const rows = b.translations as unknown as Tr[];
        const text: BlockText = {
          eyebrow: field(rows, locale, "eyebrow"),
          title: field(rows, locale, "title"),
          subtitle: field(rows, locale, "subtitle"),
          body: field(rows, locale, "body"),
          ctaLabel: field(rows, locale, "ctaLabel"),
          ctaHref: field(rows, "en", "ctaHref"),
        };
        return {
          id: b.id,
          type: b.type,
          props: obj(b.props),
          text,
          items: b.items.map((item): CardData => {
            const ir = item.translations as unknown as Tr[];
            return {
              id: item.id,
              mediaId: item.mediaId,
              linkUrl: item.linkUrl,
              iconName: item.iconName,
              props: obj(item.props),
              title: field(ir, locale, "title"),
              subtitle: field(ir, locale, "subtitle"),
              body: field(ir, locale, "body"),
              ctaLabel: field(ir, locale, "ctaLabel"),
            };
          }),
        };
      }),
    }))
    .filter((s) => s.blocks.length > 0);
}

/** Every media id a page's blocks refer to, for one lookup. */
export function mediaIdsOf(sections: PublicSection[]): string[] {
  return sections.flatMap((s) => s.blocks.flatMap((b) => b.items.map((i) => i.mediaId).filter((x): x is string => Boolean(x))));
}
