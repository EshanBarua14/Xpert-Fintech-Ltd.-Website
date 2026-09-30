"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { storage } from "@/lib/storage";
import { cleanFileName, MAX_BYTES, sniff } from "@/lib/media/inspect";
import { optionalText, toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type UploadState = { errors?: FieldErrors; message?: string; savedAt?: number; uploaded?: number };
export type MediaState = { errors?: FieldErrors; message?: string; savedAt?: number };

const MAX_FILES_PER_UPLOAD = 10;
const uuid = z.string().uuid();
const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

export async function uploadMedia(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const admin = await requireAdmin();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { errors: { files: "Choose at least one file." } };
  if (files.length > MAX_FILES_PER_UPLOAD) return { errors: { files: `Upload at most ${MAX_FILES_PER_UPLOAD} files at a time.` } };

  const problems: string[] = [];
  let uploaded = 0;

  for (const file of files) {
    const name = cleanFileName(file.name);
    const data = Buffer.from(await file.arrayBuffer());
    const type = sniff(data);
    if (!type) {
      problems.push(`${name}: not a PNG, JPEG, WebP, GIF or PDF file.`);
      continue;
    }
    if (data.length > MAX_BYTES[type.kind]) {
      problems.push(`${name}: larger than ${mb(MAX_BYTES[type.kind])}.`);
      continue;
    }

    const storageKey = `${randomUUID()}.${type.ext}`;
    const checksum = createHash("sha256").update(data).digest("hex");
    try {
      await storage().put(storageKey, data, type.mimeType);
      await db.media.create({
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
          createdById: admin.id,
          updatedById: admin.id,
        },
      });
      uploaded++;
    } catch (error) {
      console.error("[media] upload failed", error);
      await storage().remove(storageKey).catch(() => {});
      problems.push(`${name}: could not be saved.`);
    }
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
  const media = await db.media.findUnique({ where: { id }, include: { _count: { select: { usages: true } } } });
  if (!media || !media.deletedAt || media._count.usages > 0) redirect(`/admin/media/${id}`);
  await db.media.delete({ where: { id } });
  await storage().remove(media.storageKey);
  redirect("/admin/media?view=trash&deleted=1");
}
