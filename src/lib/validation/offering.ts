import { z } from "zod";
import { checkbox, optionalId, optionalText, slugField } from "./common";

export const OFFERING_TYPES = ["PRODUCT", "PLATFORM", "MODULE", "CAPABILITY", "SERVICE", "INTEGRATION"] as const;

export const OFFERING_ITEM_KINDS = [
  "CAPABILITY",
  "WORKFLOW_STEP",
  "ARCHITECTURE_LAYER",
  "INTEGRATION",
  "SECURITY",
  "USE_CASE",
  "TARGET_USER",
  "FAQ",
] as const;

export const ITEM_KIND_LABELS: Record<(typeof OFFERING_ITEM_KINDS)[number], string> = {
  CAPABILITY: "Key features (shown first on the product page)",
  WORKFLOW_STEP: "How it works (automated steps)",
  ARCHITECTURE_LAYER: "Architecture layers",
  INTEGRATION: "Integrations",
  SECURITY: "Security",
  USE_CASE: "Use cases",
  TARGET_USER: "Built for (target users, also shown at a glance)",
  FAQ: "FAQs",
};

const translation = {
  slug: slugField,
  tagline: optionalText(200),
  summary: optionalText(2000),
  problem: optionalText(4000),
  solution: optionalText(4000),
  targetCustomers: optionalText(1000),
  ctaLabel: optionalText(60),
};

export const offeringSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(OFFERING_TYPES),
  parentId: z
    .string()
    .uuid()
    .or(z.literal(""))
    .transform((v) => v || null),
  isFeatured: checkbox,
  hasOwnPage: checkbox,
  showDemoCta: checkbox,
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  iconMediaId: optionalId,
  en: z.object({ name: z.string().trim().min(1, "English name is required.").max(120), ...translation }),
  // Bangla is optional: leave the name empty to have no Bangla version yet.
  bn: z.object({ name: z.string().trim().max(120), ...translation }),
});

export type OfferingInput = z.infer<typeof offeringSchema>;

export const offeringItemSchema = z.object({
  offeringId: z.string().uuid(),
  kind: z.enum(OFFERING_ITEM_KINDS),
  enTitle: z.string().trim().min(1, "English title is required.").max(200),
  enBody: optionalText(4000),
  bnTitle: z.string().trim().max(200),
  bnBody: optionalText(4000),
});
