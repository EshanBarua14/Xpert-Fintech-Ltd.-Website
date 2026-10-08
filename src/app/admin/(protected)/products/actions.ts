"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { parseLocalDateTime, slugify, toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { offeringItemSchema, offeringSchema } from "@/lib/validation/offering";
import { purgeOffering } from "@/lib/admin/purge";
import { allUsableImages, isUsableImage, isUsableVideoFile, syncMediaUsage } from "@/lib/admin/media";
import { parseVideoUrl } from "@/lib/public/text";

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
    iconMediaId: formData.get("iconMediaId") ?? "",
    en: readTranslation(formData, "en"),
    bn: readTranslation(formData, "bn"),
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };

  const input = parsed.data;
  if (input.parentId && input.parentId === input.id) {
    return { errors: { parentId: "A product cannot be its own parent." } };
  }

  if (!(await isUsableImage(input.iconMediaId))) return { errors: { iconMediaId: "That image is no longer in the media library." } };

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
    iconMediaId: input.iconMediaId,
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
      await syncMediaUsage(tx, "OFFERING", offeringId, "icon", input.iconMediaId);

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
  await purgeOffering(id);
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

// ── Product screens and demo video ───────────────────────────────────────────

const mediaSchema = z
  .object({
    offeringId: z.string().uuid(),
    screenshots: z.array(z.string().uuid()).max(24, "Use at most 24 screens."),
    source: z.enum(["NONE", "LINK", "FILE"]),
    videoUrl: z.string().trim().max(500),
    videoFileId: z.string().trim(),
    posterMediaId: z.string().trim(),
    captionEn: z.string().trim().max(300),
    captionBn: z.string().trim().max(300),
  })
  .superRefine((v, ctx) => {
    if (v.source === "LINK" && !parseVideoUrl(v.videoUrl)) ctx.addIssue({ code: "custom", path: ["videoUrl"], message: "Paste a YouTube, Vimeo or Facebook video address." });
    if (v.source === "FILE" && !uuid.safeParse(v.videoFileId).success) ctx.addIssue({ code: "custom", path: ["videoFileId"], message: "Choose a video file." });
  });

/**
 * Saves a product's screens (in the order given) and its demo video. Screens
 * keep their captions when they stay; one demo video per product.
 */
export async function saveOfferingMedia(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = mediaSchema.safeParse({
    offeringId: formData.get("offeringId") ?? "",
    screenshots: formData.getAll("screenshots").map(String),
    source: formData.get("source") ?? "NONE",
    videoUrl: formData.get("videoUrl") ?? "",
    videoFileId: formData.get("videoFileId") ?? "",
    posterMediaId: formData.get("posterMediaId") ?? "",
    captionEn: formData.get("captionEn") ?? "",
    captionBn: formData.get("captionBn") ?? "",
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  const screenshots = [...new Set(v.screenshots)];
  if (!(await allUsableImages(screenshots))) return { errors: { screenshots: "One of the screens is no longer in the media library." } };
  if (v.posterMediaId && !(await isUsableImage(v.posterMediaId))) return { errors: { posterMediaId: "Choose an image from the media library." } };
  if (v.source === "FILE" && !(await isUsableVideoFile(v.videoFileId))) return { errors: { videoFileId: "Choose a video file from the media library." } };
  const link = v.source === "LINK" ? parseVideoUrl(v.videoUrl) : null;

  await db.$transaction(async (tx) => {
    const existing = await tx.offeringMedia.findMany({ where: { offeringId: v.offeringId } });
    // Screens: keep rows that stay (their captions too), add new ones, drop the rest.
    const shots = existing.filter((m) => m.kind !== "VIDEO");
    const keep = new Set(screenshots);
    const drop = shots.filter((m) => !m.mediaId || !keep.has(m.mediaId)).map((m) => m.id);
    if (drop.length) await tx.offeringMedia.deleteMany({ where: { id: { in: drop } } });
    for (const [i, mediaId] of screenshots.entries()) {
      const row = shots.find((m) => m.mediaId === mediaId);
      if (row) await tx.offeringMedia.update({ where: { id: row.id }, data: { sortOrder: i, isHidden: false } });
      else await tx.offeringMedia.create({ data: { offeringId: v.offeringId, kind: "SCREENSHOT", mediaId, sortOrder: i } });
    }
    // Demo video: one row.
    const videos = existing.filter((m) => m.kind === "VIDEO");
    if (v.source === "NONE") {
      if (videos.length) await tx.offeringMedia.deleteMany({ where: { id: { in: videos.map((m) => m.id) } } });
    } else {
      const data = {
        videoProvider: link ? link.provider : ("UPLOAD" as const),
        videoUrl: link ? v.videoUrl : null,
        mediaId: v.source === "FILE" ? v.videoFileId : null,
        posterMediaId: v.posterMediaId || null,
        isHidden: false,
        sortOrder: 0,
      };
      const [first, ...extra] = videos;
      if (extra.length) await tx.offeringMedia.deleteMany({ where: { id: { in: extra.map((m) => m.id) } } });
      const row = first
        ? await tx.offeringMedia.update({ where: { id: first.id }, data })
        : await tx.offeringMedia.create({ data: { offeringId: v.offeringId, kind: "VIDEO", ...data } });
      for (const [locale, caption] of [["en", v.captionEn], ["bn", v.captionBn]] as const) {
        if (caption) {
          await tx.offeringMediaTranslation.upsert({
            where: { itemId_locale: { itemId: row.id, locale } },
            update: { caption },
            create: { itemId: row.id, locale, caption },
          });
        } else {
          await tx.offeringMediaTranslation.deleteMany({ where: { itemId: row.id, locale } });
        }
      }
    }
    // Media library "used in" counts.
    await tx.mediaUsage.deleteMany({ where: { entityType: "OFFERING", entityId: v.offeringId, field: "screenshots" } });
    if (screenshots.length) {
      await tx.mediaUsage.createMany({ data: screenshots.map((mediaId) => ({ mediaId, entityType: "OFFERING" as const, entityId: v.offeringId, field: "screenshots" })) });
    }
    await syncMediaUsage(tx, "OFFERING", v.offeringId, "demoVideo", v.source === "FILE" ? v.videoFileId : null);
    await syncMediaUsage(tx, "OFFERING", v.offeringId, "demoPoster", v.source !== "NONE" && v.posterMediaId ? v.posterMediaId : null);
  });

  refreshSite();
  revalidatePath(`/admin/products/${v.offeringId}`);
  return { message: "Screens and demo video saved.", savedAt: Date.now() };
}
