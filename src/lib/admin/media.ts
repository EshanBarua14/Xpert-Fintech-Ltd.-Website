import "server-only";
import type { EntityType, Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";

/**
 * Records which records use which media file, so the media library can show
 * "Used in N places" and refuse permanent deletion of files still in use.
 * Call inside the same transaction that saves the record.
 */
export async function syncMediaUsage(
  tx: Prisma.TransactionClient,
  entityType: EntityType,
  entityId: string,
  field: string,
  mediaId: string | null,
) {
  await tx.mediaUsage.deleteMany({ where: { entityType, entityId, field } });
  if (mediaId) {
    await tx.mediaUsage.create({ data: { mediaId, entityType, entityId, field } });
  }
}

/** Removes every usage row of a record (on permanent delete). */
export async function clearMediaUsage(tx: Prisma.TransactionClient, entityType: EntityType, entityId: string) {
  await tx.mediaUsage.deleteMany({ where: { entityType, entityId } });
}

export type ImageOption = { id: string; url: string; name: string; width: number | null; height: number | null };

/** Images available to pick in admin forms (newest first). */
export async function imageOptions(): Promise<ImageOption[]> {
  const rows = await db.media.findMany({
    where: { kind: "IMAGE", deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { id: true, storageKey: true, originalName: true, width: true, height: true },
  });
  return rows.map((m) => ({ id: m.id, url: `/media/${m.storageKey}`, name: m.originalName, width: m.width, height: m.height }));
}

/** True when the id is an image in the library (not in the trash). */
export async function isUsableImage(id: string | null | undefined): Promise<boolean> {
  if (!id) return true;
  const m = await db.media.findFirst({ where: { id, kind: "IMAGE", deletedAt: null }, select: { id: true } });
  return Boolean(m);
}

export type DocumentOption = { value: string; label: string };

/** PDFs in the library that may be published (job applicants' CVs are excluded). */
export async function documentOptions(): Promise<DocumentOption[]> {
  const rows = await db.media.findMany({
    where: { kind: "DOCUMENT", deletedAt: null, NOT: { tags: { has: "private" } } },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { id: true, originalName: true, sizeBytes: true },
  });
  return rows.map((m) => ({ value: m.id, label: `${m.originalName} (${Math.max(1, Math.round(m.sizeBytes / 1024))} KB)` }));
}

/** True when the id is a publishable document in the library. */
export async function isUsableDocument(id: string | null | undefined): Promise<boolean> {
  if (!id) return true;
  const m = await db.media.findFirst({ where: { id, kind: "DOCUMENT", deletedAt: null, NOT: { tags: { has: "private" } } }, select: { id: true } });
  return Boolean(m);
}
