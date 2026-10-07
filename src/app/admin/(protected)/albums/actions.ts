"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { formInput } from "@/lib/admin/forms";
import { allUsableImages, isUsableImage, syncMediaUsage } from "@/lib/admin/media";
import { purgeAlbum } from "@/lib/admin/purge";
import { parseDateOnly } from "@/lib/validation/organizations";
import { optionalId, optionalText, parseLocalDateTime, slugField, slugify, toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type AlbumState = { errors?: FieldErrors; message?: string };

const schema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  takenAt: z.string().optional(),
  coverMediaId: optionalId,
  enTitle: z.string().trim().min(1, "English title is required.").max(200),
  enSlug: slugField,
  enDescription: optionalText(2000),
  bnTitle: z.string().trim().max(200),
  bnSlug: slugField,
  bnDescription: optionalText(2000),
});

const uuid = z.string().uuid();
const refresh = () => revalidatePath("/", "layout");

export async function saveAlbum(_prev: AlbumState, formData: FormData): Promise<AlbumState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(formInput(schema.shape, formData, ["takenAt"]));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;

  const photoIds = [...new Set(z.array(z.string().uuid()).max(500).parse(formData.getAll("photos").map(String)))];
  if (!(await allUsableImages(photoIds))) {
    return { errors: { photos: "Some photos are no longer in the media library. Remove them and save again." }, message: "Please fix the highlighted fields." };
  }
  if (v.status === "PUBLISHED" && photoIds.length === 0) {
    return { errors: { photos: "Add at least one photo before publishing." }, message: "An album needs photos to be published." };
  }
  if (!(await isUsableImage(v.coverMediaId))) return { errors: { coverMediaId: "That image is no longer in the media library." } };

  const enSlug = v.enSlug || slugify(v.enTitle);
  if (!enSlug) return { errors: { enSlug: "Enter a URL slug using English letters." } };
  const bnSlug = v.bnSlug || enSlug;

  const data = {
    status: v.status,
    publishAt: parseLocalDateTime(v.publishAt),
    sortOrder: v.sortOrder,
    takenAt: parseDateOnly(v.takenAt),
    coverMediaId: v.coverMediaId,
    updatedById: admin.id,
  };
  const text = (l: "en" | "bn") => ({
    slug: l === "en" ? enSlug : bnSlug,
    title: l === "en" ? v.enTitle : v.bnTitle,
    description: (l === "en" ? v.enDescription : v.bnDescription) ?? null,
  });

  let id = v.id;
  try {
    await db.$transaction(async (tx) => {
      if (id) await tx.album.update({ where: { id }, data });
      else id = (await tx.album.create({ data: { ...data, createdById: admin.id } })).id;
      const albumId = id!;
      await tx.albumTranslation.upsert({ where: { albumId_locale: { albumId, locale: "en" } }, update: text("en"), create: { albumId, locale: "en", ...text("en") } });
      if (v.bnTitle) {
        await tx.albumTranslation.upsert({ where: { albumId_locale: { albumId, locale: "bn" } }, update: text("bn"), create: { albumId, locale: "bn", ...text("bn") } });
      } else {
        await tx.albumTranslation.deleteMany({ where: { albumId, locale: "bn" } });
      }
      // Photos, in the order chosen in the editor.
      await tx.albumMedia.deleteMany({ where: { albumId } });
      await tx.mediaUsage.deleteMany({ where: { entityType: "ALBUM", entityId: albumId, field: "photos" } });
      if (photoIds.length) {
        await tx.albumMedia.createMany({ data: photoIds.map((mediaId, i) => ({ albumId, mediaId, sortOrder: i })) });
        await tx.mediaUsage.createMany({
          data: photoIds.map((mediaId) => ({ mediaId, entityType: "ALBUM" as const, entityId: albumId, field: "photos" })),
          skipDuplicates: true,
        });
      }
      await syncMediaUsage(tx, "ALBUM", albumId, "cover", v.coverMediaId);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { enSlug: "Another album already uses this URL slug." }, message: "That URL is taken." };
    }
    console.error("[admin] saveAlbum failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  redirect(`/admin/albums/${id}?saved=1`);
}

export async function trashAlbum(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.album.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  refresh();
  redirect("/admin/albums?trashed=1");
}

export async function restoreAlbum(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.album.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  refresh();
  redirect(`/admin/albums/${id}?restored=1`);
}

export async function deleteAlbumForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const a = await db.album.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!a?.deletedAt) redirect(`/admin/albums/${id}`);
  await purgeAlbum(id);
  refresh();
  redirect("/admin/albums?view=trash&deleted=1");
}
