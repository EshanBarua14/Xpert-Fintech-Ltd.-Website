import "server-only";
import { db } from "@/lib/db/client";
import { toLocalInput } from "@/lib/validation/common";
import type { ProductFormValues } from "@/components/admin/ProductForm";

const emptyTranslation = {
  name: "",
  slug: "",
  tagline: "",
  summary: "",
  problem: "",
  solution: "",
  targetCustomers: "",
  ctaLabel: "",
};

export const newProductValues: ProductFormValues = {
  type: "PRODUCT",
  parentId: "",
  isFeatured: false,
  hasOwnPage: true,
  showDemoCta: true,
  status: "DRAFT",
  publishAt: "",
  sortOrder: 0,
  en: { ...emptyTranslation },
  bn: { ...emptyTranslation },
};

type TranslationRow = {
  locale: string;
  name: string;
  slug: string;
  tagline: string | null;
  summary: string | null;
  problem: string | null;
  solution: string | null;
  targetCustomers: string | null;
  ctaLabel: string | null;
};

function toFormTranslation(row: TranslationRow | undefined) {
  if (!row) return { ...emptyTranslation };
  return {
    name: row.name,
    slug: row.slug,
    tagline: row.tagline ?? "",
    summary: row.summary ?? "",
    problem: row.problem ?? "",
    solution: row.solution ?? "",
    targetCustomers: row.targetCustomers ?? "",
    ctaLabel: row.ctaLabel ?? "",
  };
}

export function toProductFormValues(o: {
  id: string;
  type: ProductFormValues["type"];
  parentId: string | null;
  isFeatured: boolean;
  hasOwnPage: boolean;
  showDemoCta: boolean;
  status: ProductFormValues["status"];
  publishAt: Date | null;
  sortOrder: number;
  translations: TranslationRow[];
}): ProductFormValues {
  return {
    id: o.id,
    type: o.type,
    parentId: o.parentId ?? "",
    isFeatured: o.isFeatured,
    hasOwnPage: o.hasOwnPage,
    showDemoCta: o.showDemoCta,
    status: o.status,
    publishAt: toLocalInput(o.publishAt),
    sortOrder: o.sortOrder,
    en: toFormTranslation(o.translations.find((t) => t.locale === "en")),
    bn: toFormTranslation(o.translations.find((t) => t.locale === "bn")),
  };
}

/** Platforms and products that other offerings can sit inside. */
export async function parentOptions(excludeId?: string) {
  const rows = await db.offering.findMany({
    where: { deletedAt: null, type: { in: ["PLATFORM", "PRODUCT"] }, ...(excludeId && { id: { not: excludeId } }) },
    orderBy: { sortOrder: "asc" },
    include: { translations: { where: { locale: "en" } } },
  });
  return rows.map((r) => ({ value: r.id, label: r.translations[0]?.name ?? "(untitled)" }));
}
