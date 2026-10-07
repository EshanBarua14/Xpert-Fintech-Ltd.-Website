"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { formInput } from "@/lib/admin/forms";
import { isUsableDocument, isUsableImage, syncMediaUsage } from "@/lib/admin/media";
import { purgeResource } from "@/lib/admin/purge";
import { optionalHttpsUrl, optionalId, optionalText, parseLocalDateTime, slugField, slugify, toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type ResourceState = { errors?: FieldErrors; message?: string };

const schema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  kind: z.enum(["BROCHURE", "PRODUCT_SHEET", "WHITEPAPER", "TECHNICAL_DOCUMENT", "PRESENTATION", "VIDEO", "OTHER"]),
  fileMediaId: optionalId,
  externalUrl: optionalHttpsUrl,
  coverMediaId: optionalId,
  enTitle: z.string().trim().min(1, "English title is required.").max(200),
  enSlug: slugField,
  enSummary: optionalText(800),
  bnTitle: z.string().trim().max(200),
  bnSlug: slugField,
  bnSummary: optionalText(800),
});

const uuid = z.string().uuid();
const refresh = () => revalidatePath("/", "layout");

export async function saveResource(_prev: ResourceState, formData: FormData): Promise<ResourceState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(formInput(schema.shape, formData));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  if (!v.fileMediaId && !v.externalUrl) return { errors: { fileMediaId: "Choose a PDF from the media library, or enter a link." }, message: "Add a file or a link." };
  if (!(await isUsableDocument(v.fileMediaId))) return { errors: { fileMediaId: "That file is no longer in the media library." } };
  if (!(await isUsableImage(v.coverMediaId))) return { errors: { coverMediaId: "That image is no longer in the media library." } };
  const enSlug = v.enSlug || slugify(v.enTitle);
  if (!enSlug) return { errors: { enSlug: "Enter a URL slug using English letters." } };
  const bnSlug = v.bnSlug || enSlug;

  const data = {
    status: v.status,
    publishAt: parseLocalDateTime(v.publishAt),
    sortOrder: v.sortOrder,
    kind: v.kind,
    fileMediaId: v.fileMediaId,
    externalUrl: v.externalUrl,
    coverMediaId: v.coverMediaId,
    updatedById: admin.id,
  };
  let id = v.id;
  try {
    await db.$transaction(async (tx) => {
      if (id) await tx.resource.update({ where: { id }, data });
      else id = (await tx.resource.create({ data: { ...data, createdById: admin.id } })).id;
      const resourceId = id!;
      const en = { slug: enSlug, title: v.enTitle, summary: v.enSummary ?? null };
      await tx.resourceTranslation.upsert({ where: { resourceId_locale: { resourceId, locale: "en" } }, update: en, create: { resourceId, locale: "en", ...en } });
      if (v.bnTitle) {
        const bn = { slug: bnSlug, title: v.bnTitle, summary: v.bnSummary ?? null };
        await tx.resourceTranslation.upsert({ where: { resourceId_locale: { resourceId, locale: "bn" } }, update: bn, create: { resourceId, locale: "bn", ...bn } });
      } else {
        await tx.resourceTranslation.deleteMany({ where: { resourceId, locale: "bn" } });
      }
      await syncMediaUsage(tx, "RESOURCE", resourceId, "file", v.fileMediaId);
      await syncMediaUsage(tx, "RESOURCE", resourceId, "cover", v.coverMediaId);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { enSlug: "Another resource already uses this URL slug." }, message: "That URL is taken." };
    }
    console.error("[admin] saveResource failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  redirect(`/admin/resources/${id}?saved=1`);
}

export async function trashResource(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.resource.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  refresh();
  redirect("/admin/resources?trashed=1");
}

export async function restoreResource(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.resource.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  refresh();
  redirect(`/admin/resources/${id}?restored=1`);
}

export async function deleteResourceForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const r = await db.resource.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!r?.deletedAt) redirect(`/admin/resources/${id}`);
  await purgeResource(id);
  refresh();
  redirect("/admin/resources?view=trash&deleted=1");
}
