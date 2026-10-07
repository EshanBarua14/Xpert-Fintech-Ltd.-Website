"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { storage } from "@/lib/storage";
import { purgeMedia } from "@/lib/admin/purge";
import { cleanFileName, MAX_BYTES, sniff } from "@/lib/media/inspect";
import { optionalText, toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type UploadState = { errors?: FieldErrors; message?: string; savedAt?: number; uploaded?: number };
export type MediaState = { errors?: FieldErrors; message?: string; savedAt?: number };

const MAX_FILES_PER_UPLOAD = 10;
const uuid = z.string().uuid();
const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

/** Checks one uploaded file by its content, stores it and adds it to the library. */
async function storeUpload(file: File, adminId: string, only?: "IMAGE"): Promise<{ problem: string } | { id: string; storageKey: string; name: string; width: number | null; height: number | null }> {
  const name = cleanFileName(file.name);
  const data = Buffer.from(await file.arrayBuffer());
  const type = sniff(data);
  if (!type || (only && type.kind !== only)) {
    return { problem: only ? `${name}: not a PNG, JPEG, WebP or GIF image.` : `${name}: not a PNG, JPEG, WebP, GIF, PDF, MP4 or WebM file.` };
  }
  if (data.length > MAX_BYTES[type.kind]) return { problem: `${name}: larger than ${mb(MAX_BYTES[type.kind])}.` };

  const storageKey = `${randomUUID()}.${type.ext}`;
  const checksum = createHash("sha256").update(data).digest("hex");
  try {
    await storage().put(storageKey, data, type.mimeType);
    const row = await db.media.create({
      data: {
        kind: type.kind,
        storageKey,
        originalName: name,
        mimeType: type.mimeType,
        sizeBytes: data.length,
        width: type.width ?? null,
        height: type.height ?? null,
        checksum,
        // Content type verified from the file itself. A virus-scan hook can
        // flip this to false until a scanner approves the file.
        isScanned: true,
        createdById: adminId,
        updatedById: adminId,
      },
    });
    return { id: row.id, storageKey, name, width: row.width, height: row.height };
  } catch (error) {
    console.error("[media] upload failed", error);
    await storage().remove(storageKey).catch(() => {});
    return { problem: `${name}: could not be saved.` };
  }
}

export type PhotoUploadResult = { added: { id: string; url: string; name: string; width: number | null; height: number | null }[]; problems: string[] };

/**
 * Uploads photos straight from an album or event editor. Returns the new
 * library entries so the editor can add them to the gallery right away.
 */
export async function uploadPhotos(formData: FormData): Promise<PhotoUploadResult> {
  const admin = await requireAdmin();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES_PER_UPLOAD) return { added: [], problems: [`Upload at most ${MAX_FILES_PER_UPLOAD} photos at a time.`] };
  const added: PhotoUploadResult["added"] = [];
  const problems: string[] = [];
  for (const file of files) {
    const r = await storeUpload(file, admin.id, "IMAGE");
    if ("problem" in r) problems.push(r.problem);
    else added.push({ id: r.id, url: `/media/${r.storageKey}`, name: r.name, width: r.width, height: r.height });
  }
  if (added.length) revalidatePath("/admin/media");
  return { added, problems };
}

export async function uploadMedia(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const admin = await requireAdmin();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { errors: { files: "Choose at least one file." } };
  if (files.length > MAX_FILES_PER_UPLOAD) return { errors: { files: `Upload at most ${MAX_FILES_PER_UPLOAD} files at a time.` } };

  const problems: string[] = [];
  let uploaded = 0;

  for (const file of files) {
    const result = await storeUpload(file, admin.id);
    if ("problem" in result) problems.push(result.problem);
    else uploaded++;
  }

  revalidatePath("/admin/media");
  return {
    uploaded,
    savedAt: Date.now(),
    message: uploaded ? `${uploaded} file${uploaded === 1 ? "" : "s"} uploaded.` : undefined,
    errors: problems.length ? { files: problems.join(" ") } : undefined,
  };
}

const detailsSchema = z.object({
  id: z.string().uuid(),
  enAlt: optionalText(250),
  bnAlt: optionalText(250),
  enCaption: optionalText(500),
  bnCaption: optionalText(500),
  tags: z.string().max(300),
});

export async function saveMediaDetails(_prev: MediaState, formData: FormData): Promise<MediaState> {
  const admin = await requireAdmin();
  const parsed = detailsSchema.safeParse(Object.fromEntries(Object.keys(detailsSchema.shape).map((k) => [k, formData.get(k) ?? ""])));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error) };
  const v = parsed.data;
  const tags = [...new Set(v.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 20);

  await db.$transaction(async (tx) => {
    await tx.media.update({ where: { id: v.id }, data: { tags, updatedById: admin.id } });
    for (const [locale, altText, caption] of [
      ["en", v.enAlt, v.enCaption],
      ["bn", v.bnAlt, v.bnCaption],
    ] as const) {
      if (altText || caption) {
        await tx.mediaTranslation.upsert({
          where: { mediaId_locale: { mediaId: v.id, locale } },
          update: { altText: altText ?? null, caption: caption ?? null },
          create: { mediaId: v.id, locale, altText: altText ?? null, caption: caption ?? null },
        });
      } else {
        await tx.mediaTranslation.deleteMany({ where: { mediaId: v.id, locale } });
      }
    }
  });
  revalidatePath("/", "layout");
  return { message: "Saved.", savedAt: Date.now() };
}

export async function trashMedia(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.media.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  revalidatePath("/", "layout");
  redirect("/admin/media?trashed=1");
}

export async function restoreMedia(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.media.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  revalidatePath("/", "layout");
  redirect(`/admin/media/${id}`);
}

/** Permanent delete: only from the trash, and only when nothing uses the file. */
export async function deleteMediaForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const media = await db.media.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!media?.deletedAt || !(await purgeMedia(id))) redirect(`/admin/media/${id}`);
  redirect("/admin/media?view=trash&deleted=1");
}
