/**
 * Block catalogue. Every block type the page builder offers is described
 * here once: which text fields it has, which settings (with validation),
 * and whether it holds cards. The admin editor and (later) the public
 * renderer both read this, so adding a block type is one entry, not a
 * new screen.
 *
 * Text fields are stored per language in ContentBlockTranslation /
 * BlockItemTranslation; settings are stored in the `props` JSON column.
 */
import { z } from "zod";

export type Setting =
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; default: string; hint?: string }
  | { key: string; label: string; type: "number"; min: number; max: number; default: number; hint?: string }
  | { key: string; label: string; type: "boolean"; default: boolean; hint?: string }
  | { key: string; label: string; type: "text" | "url"; default: string; hint?: string; max?: number };

type TextFields = { eyebrow?: string; title?: string; subtitle?: string; body?: string; cta?: boolean };
type CardFields = TextFields & { media?: string; icon?: boolean; link?: boolean };

export type BlockDefinition = {
  label: string;
  description: string;
  text: TextFields;
  settings: Setting[];
  cards?: { singular: string; fields: CardFields; settings?: Setting[] };
};

const columns: Setting = {
  key: "columns",
  label: "Columns on desktop",
  type: "select",
  options: [
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
  ],
  default: "3",
};

export const BLOCKS = {
  HERO: {
    label: "Hero",
    description: "Large opening statement with buttons.",
    text: { eyebrow: "Small label above", title: "Headline", subtitle: "Supporting statement", cta: true },
    settings: [
      {
        key: "visual",
        label: "Visual",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "network", label: "Market network animation" },
          { value: "image", label: "Image (first card)" },
        ],
        default: "network",
      },
      { key: "secondaryCtaLabelEn", label: "Second button label (English)", type: "text", default: "", max: 40 },
      { key: "secondaryCtaLabelBn", label: "Second button label (বাংলা)", type: "text", default: "", max: 40 },
      { key: "secondaryCtaHref", label: "Second button link", type: "text", default: "", hint: "Page path, e.g. request-demo", max: 200 },
    ],
    cards: { singular: "Hero image", fields: { media: "Image" } },
  },
  RICH_TEXT: {
    label: "Text",
    description: "Heading and paragraphs.",
    text: { eyebrow: "Small label above", title: "Heading", body: "Text" },
    settings: [
      {
        key: "width",
        label: "Width",
        type: "select",
        options: [
          { value: "narrow", label: "Narrow (easy reading)" },
          { value: "wide", label: "Wide" },
        ],
        default: "narrow",
      },
    ],
  },
  STATS: {
    label: "Numbers",
    description: "Headline figures. Only publish numbers Xpert can source.",
    text: { eyebrow: "Small label above", title: "Heading" },
    settings: [columns],
    cards: {
      singular: "Number",
      fields: { title: "Label", subtitle: "Value (e.g. 12)" },
      settings: [
        { key: "sourceNote", label: "Source", type: "text", default: "", hint: "Shown on hover, e.g. Xpert records, Sep 2026", max: 200 },
      ],
    },
  },
  PRODUCT_GRID: {
    label: "Product grid",
    description: "Cards for products, taken from Admin → Products.",
    text: { eyebrow: "Small label above", title: "Heading", subtitle: "Intro" },
    settings: [
      {
        key: "source",
        label: "Show",
        type: "select",
        options: [
          { value: "featured", label: "Featured products" },
          { value: "all", label: "All published products" },
        ],
        default: "all",
      },
      { key: "limit", label: "Maximum", type: "number", min: 1, max: 24, default: 8 },
      columns,
    ],
  },
  FEATURE_GRID: {
    label: "Feature cards",
    description: "Grid of cards with a title, text and optional icon or link.",
    text: { eyebrow: "Small label above", title: "Heading", subtitle: "Intro" },
    settings: [columns],
    cards: { singular: "Card", fields: { title: "Title", body: "Text", media: "Image (optional)", icon: true, link: true } },
  },
  VALUES: {
    label: "Values",
    description: "Short list of values or principles.",
    text: { title: "Heading" },
    settings: [columns],
    cards: { singular: "Value", fields: { title: "Value", body: "Meaning" } },
  },
  WORKFLOW: {
    label: "Workflow",
    description: "Numbered steps with the moving order-flow animation.",
    text: { eyebrow: "Small label above", title: "Heading", subtitle: "Intro" },
    settings: [{ key: "conceptual", label: "Label as conceptual view", type: "boolean", default: true }],
    cards: {
      singular: "Step",
      fields: { title: "Step name", subtitle: "Short note" },
      settings: [{ key: "highlight", label: "Highlight this step", type: "boolean", default: false }],
    },
  },
  NETWORK_DIAGRAM: {
    label: "Market network",
    description: "Interactive diagram of how systems connect. Nodes are the cards.",
    text: { eyebrow: "Small label above", title: "Heading", subtitle: "Intro" },
    settings: [{ key: "conceptual", label: "Label as conceptual view", type: "boolean", default: true }],
    cards: { singular: "Node", fields: { title: "Name", body: "Shown when selected", link: true } },
  },
  TIMELINE: {
    label: "Timeline",
    description: "Dated milestones.",
    text: { eyebrow: "Small label above", title: "Heading" },
    settings: [],
    cards: { singular: "Milestone", fields: { subtitle: "Date (e.g. Nov 2024)", title: "Title", body: "Details", link: true } },
  },
  LOGO_CLOUD: {
    label: "Logos",
    description: "Organizations from Admin → Organizations. Logos show only with permission on file.",
    text: { eyebrow: "Small label above", title: "Heading" },
    settings: [
      {
        key: "kind",
        label: "Show",
        type: "select",
        options: [
          { value: "CONSORTIUM_MEMBER", label: "Consortium members" },
          { value: "CLIENT", label: "Clients" },
          { value: "PARTNER", label: "Partners" },
          { value: "EXCHANGE", label: "Exchanges" },
        ],
        default: "CONSORTIUM_MEMBER",
      },
    ],
  },
  PEOPLE_LIST: {
    label: "People",
    description: "Board or management from Admin → People.",
    text: { eyebrow: "Small label above", title: "Heading", subtitle: "Intro" },
    settings: [
      {
        key: "group",
        label: "Group",
        type: "select",
        options: [
          { value: "BOARD", label: "Board of directors" },
          { value: "MANAGEMENT", label: "Management committee" },
          { value: "LEADERSHIP", label: "Leadership" },
          { value: "TEAM", label: "Team" },
        ],
        default: "MANAGEMENT",
      },
    ],
  },
  EVENT_LIST: {
    label: "Events list",
    description: "Latest published events.",
    text: { eyebrow: "Small label above", title: "Heading" },
    settings: [{ key: "limit", label: "Maximum", type: "number", min: 1, max: 12, default: 3 }],
  },
  FAQ: {
    label: "FAQ",
    description: "Questions and answers.",
    text: { title: "Heading" },
    settings: [],
    cards: { singular: "Question", fields: { title: "Question", body: "Answer" } },
  },
  VIDEO: {
    label: "Video",
    description: "YouTube or Vimeo video, loaded only when played.",
    text: { title: "Heading", subtitle: "Caption" },
    settings: [{ key: "url", label: "Video link", type: "url", default: "", hint: "https://www.youtube.com/watch?v=…" }],
  },
  CTA: {
    label: "Call to action",
    description: "Closing band with a button, e.g. Request a private demo.",
    text: { title: "Headline", subtitle: "Supporting line", cta: true },
    settings: [],
  },
  LEAD_FORM: {
    label: "Demo request form",
    description: "The request-a-demo form (active once the form is built).",
    text: { title: "Heading", subtitle: "Intro" },
    settings: [],
  },
} satisfies Partial<Record<string, BlockDefinition>>;

export type BlockKey = keyof typeof BLOCKS;
export const BLOCK_KEYS = Object.keys(BLOCKS) as BlockKey[];

export function blockDefinition(type: string): BlockDefinition | null {
  return (BLOCKS as Record<string, BlockDefinition>)[type] ?? null;
}

/** Builds a validator for a list of settings; unknown keys are dropped. */
export function settingsSchema(settings: Setting[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const s of settings) {
    if (s.type === "select") {
      shape[s.key] = z.enum(s.options.map((o) => o.value) as [string, ...string[]]).catch(s.default);
    } else if (s.type === "number") {
      shape[s.key] = z.coerce.number().int().min(s.min).max(s.max).catch(s.default);
    } else if (s.type === "boolean") {
      shape[s.key] = z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean());
    } else if (s.type === "url") {
      shape[s.key] = z
        .string()
        .trim()
        .max(500)
        .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), `${s.label}: use a full https:// address`);
    } else {
      shape[s.key] = z.string().trim().max(s.max ?? 500);
    }
  }
  return z.object(shape);
}

/** Reads settings values from a form whose inputs are named `prefix.key`. */
export function readSettings(formData: FormData, settings: Setting[], prefix: string) {
  return Object.fromEntries(settings.map((s) => [s.key, formData.get(`${prefix}.${s.key}`) ?? (s.type === "boolean" ? "" : "")]));
}
