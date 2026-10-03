import { db } from "@/lib/db/client";
import { storage, STORAGE_KEY_PATTERN } from "@/lib/storage";
import { getCurrentAdmin } from "@/lib/auth/session";

/**
 * Serves uploaded media at /media/<uuid>.<ext>.
 * Only files that exist in the media library and are not in the trash are
 * served; the stored MIME type (verified at upload) is always used.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!STORAGE_KEY_PATTERN.test(key)) return new Response("Not found", { status: 404 });

  const media = await db.media.findUnique({
    where: { storageKey: key },
    select: { mimeType: true, originalName: true, deletedAt: true, isScanned: true, kind: true, tags: true },
  });
  if (!media || media.deletedAt || !media.isScanned) return new Response("Not found", { status: 404 });
  // Private files (job applicants' CVs) are only for signed-in admins, never cached publicly.
  const isPrivate = media.tags.includes("private");
  if (isPrivate && !(await getCurrentAdmin())) return new Response("Not found", { status: 404 });

  const data = await storage().get(key);
  if (!data) return new Response("Not found", { status: 404 });

  const disposition = media.kind === "DOCUMENT" ? `inline; filename="${encodeURIComponent(media.originalName)}"` : "inline";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(data.length),
      "Content-Disposition": disposition,
      // Keys are unique per upload, so a file never changes at the same URL.
      "Cache-Control": isPrivate ? "private, no-store" : "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
