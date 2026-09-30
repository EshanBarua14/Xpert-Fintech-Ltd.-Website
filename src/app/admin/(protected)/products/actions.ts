"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { parseLocalDateTime, slugify, toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { offeringItemSchema, offeringSchema } from "@/lib/validation/offering";

export type FormState = { errors?: FieldErrors; message?: string; savedAt?: number };

const TEXT_FIELDS = ["tagline", "summary", "problem", "solution", "targetCustomers", "ctaLabel"] as const;

function readTranslation(formData: FormData, locale: "en" | "bn") {
  const out: Record<string, FormDataEntryValue | null> = {
    name: formData.get(`${locale}.name`) ?? "",
    slug: formData.get(`${locale}.slug`) ?? "",
  };
  for (const f of TEXT_FIELDS) out[f] = formData.get(`${locale}.${f}`) ?? "";
  return out;
}

/** Refresh every public page that could show products (header, footer, lists). */
function refreshSite() {
  revalidatePath("/", "layout");
}

const uuid = z.string().uuid();

export async function saveOffering(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const parsed = offeringSchema.safeParse({
    id: formData.get("id") || undefined,
    type: formData.get("type"),
    parentId: formData.get("parentId") ?? "",
    isFeatured: formData.get("isFeatured"),
    hasOwnPage: formData.get("hasOwnPage"),
    showDemoCta: formData.get("showDemoCta"),
    status: formData.get("status"),
    publishAt: formData.get("publishAt") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
    en: readTranslation(formData, "en"),
    bn: readTranslation(formData, "bn"),
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };

  const input = parsed.data;
  if (input.parentId && input.parentId === input.id) {
    return { errors: { parentId: "A product cannot be its own parent." } };
  }

  const enSlug = input.en.slug || slugify(input.en.name);
  if (!enSlug) return { errors: { "en.slug": "Enter a URL slug using English letters." } };
  const hasBangla = input.bn.name.length > 0;
  const bnSlug = input.bn.slug || enSlug;

  const pick = (t: typeof input.en | typeof input.bn) =>
    Object.fromEntries(TEXT_FIELDS.map((f) => [f, t[f] ?? null])) as Record<(typeof TEXT_FIELDS)[number], string | null>;

  const base = {
    type: input.type,
    parentId: input.parentId,
    isFeatured: input.isFeatured,
    hasOwnPage: input.hasOwnPage,
    showDemoCta: input.showDemoCta,
    status: input.status,
    publishAt: parseLocalDateTime(input.publishAt),
    sortOrder: input.sortOrder,
    updatedById: admin.id,
  };

  let id = input.id;
  try {
    await db.$transaction(async (tx) => {
      if (id) {
        await tx.offering.update({ where: { id }, data: base });
      } else {
        const created = await tx.offering.create({ data: { ...base, createdById: admin.id } });
        id = created.id;
      }
      const offeringId = id!;

      await tx.offeringTranslation.upsert({
        where: { offeringId_locale: { offeringId, locale: "en" } },
        update: { name: input.en.name, slug: enSlug, ...pick(input.en) },
        create: { offeringId, locale: "en", name: input.en.name, slug: enSlug, ...pick(input.en) },
      });

      if (hasBangla) {
        await tx.offeringTranslation.upsert({
          where: { offeringId_locale: { offeringId, locale: "bn" } },
          update: { name: input.bn.name, slug: bnSlug, ...pick(input.bn) },
          create: { offeringId, locale: "bn", name: input.bn.name, slug: bnSlug, ...pick(input.bn) },
        });
      } else {
        // Empty Bangla name = no Bangla version (the /bn page stays hidden).
        await tx.offeringTranslation.deleteMany({ where: { offeringId, locale: "bn" } });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { "en.slug": "Another product already uses this URL slug." }, message: "That URL is taken." };
    }
    console.error("[admin] saveOffering failed", error);
    return { message: "Could not save. Please try again." };
  }

  refreshSite();
  redirect(`/admin/products/${id}?saved=1`);
}

export async function trashOffering(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.offering.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  refreshSite();
  redirect("/admin/products?trashed=1");
}

export async function restoreOffering(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.offering.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  refreshSite();
  redirect(`/admin/products/${id}?restored=1`);
}

/** Permanent delete — only for items already in the trash. */
export async function deleteOfferingForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const offering = await db.offering.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!offering?.deletedAt) redirect(`/admin/products/${id}`);
  // Detach references that should survive, then delete (translations, items and media cascade).
  await db.$transaction([
    db.deployment.updateMany({ where: { offeringId: id }, data: { offeringId: null } }),
    db.lead.updateMany({ where: { interestedOfferingId: id }, data: { interestedOfferingId: null } }),
    db.offering.updateMany({ where: { parentId: id }, data: { parentId: null } }),
    db.contentRelation.deleteMany({ where: { OR: [{ fromType: "OFFERING", fromId: id }, { toType: "OFFERING", toId: id }] } }),
    db.seoMetadata.deleteMany({ where: { entityType: "OFFERING", entityId: id } }),
    db.offering.delete({ where: { id } }),
  ]);
  refreshSite();
  redirect("/admin/products?view=trash&deleted=1");
}

// ── Items: capabilities, workflow steps, FAQs… ─────────────────────────────

export async function saveOfferingItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const itemId = formData.get("itemId") ? uuid.parse(formData.get("itemId")) : null;
  const parsed = offeringItemSchema.safeParse({
    offeringId: formData.get("offeringId"),
    kind: formData.get("kind"),
    enTitle: formData.get("enTitle") ?? "",
    enBody: formData.get("enBody") ?? "",
    bnTitle: formData.get("bnTitle") ?? "",
    bnBody: formData.get("bnBody") ?? "",
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error) };
  const v = parsed.data;

  await db.$transaction(async (tx) => {
    let id = itemId;
    if (id) {
      await tx.offeringItem.update({ where: { id }, data: { kind: v.kind, updatedById: admin.id } });
    } else {
      const last = await tx.offeringItem.aggregate({
        where: { offeringId: v.offeringId, kind: v.kind },
        _max: { sortOrder: true },
      });
      const created = await tx.offeringItem.create({
        data: {
          offeringId: v.offeringId,
          kind: v.kind,
          sortOrder: (last._max.sortOrder ?? -1) + 1,
          createdById: admin.id,
          updatedById: admin.id,
        },
      });
      id = created.id;
    }
    await tx.offeringItemTranslation.upsert({
      where: { itemId_locale: { itemId: id, locale: "en" } },
      update: { title: v.enTitle, body: v.enBody ?? null },
      create: { itemId: id, locale: "en", title: v.enTitle, body: v.enBody ?? null },
    });
    if (v.bnTitle) {
      await tx.offeringItemTranslation.upsert({
        where: { itemId_locale: { itemId: id, locale: "bn" } },
        update: { title: v.bnTitle, body: v.bnBody ?? null },
        create: { itemId: id, locale: "bn", title: v.bnTitle, body: v.bnBody ?? null },
      });
    } else {
      await tx.offeringItemTranslation.deleteMany({ where: { itemId: id, locale: "bn" } });
    }
    await tx.offering.update({ where: { id: v.offeringId }, data: { updatedById: admin.id } });
  });

  refreshSite();
  revalidatePath(`/admin/products/${v.offeringId}`);
  return { message: "Saved.", savedAt: Date.now() };
}

export async function deleteOfferingItem(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("itemId"));
  const item = await db.offeringItem.delete({ where: { id } });
  refreshSite();
  revalidatePath(`/admin/products/${item.offeringId}`);
}

export async function toggleOfferingItem(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("itemId"));
  const item = await db.offeringItem.findUniqueOrThrow({ where: { id } });
  await db.offeringItem.update({ where: { id }, data: { isHidden: !item.isHidden } });
  refreshSite();
  revalidatePath(`/admin/products/${item.offeringId}`);
}

/** Swap an item with its neighbour in the same group. */
export async function moveOfferingItem(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("itemId"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
  const item = await db.offeringItem.findUniqueOrThrow({ where: { id } });
  const siblings = await db.offeringItem.findMany({
    where: { offeringId: item.offeringId, kind: item.kind },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const index = siblings.findIndex((s) => s.id === id);
  const target = siblings[direction === "up" ? index - 1 : index + 1];
  if (target) {
    // Rewrite orders 0..n so ties from older data are resolved too.
    const reordered = [...siblings];
    reordered[index] = target;
    reordered[siblings.indexOf(target)] = item;
    await db.$transaction(reordered.map((s, i) => db.offeringItem.update({ where: { id: s.id }, data: { sortOrder: i } })));
  }
  refreshSite();
  revalidatePath(`/admin/products/${item.offeringId}`);
}
