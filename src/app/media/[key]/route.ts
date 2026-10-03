import { db } from "@/lib/db/client";
import { storage, STORAGE_KEY_PATTERN } from "@/lib/storage";
import { getCurrentAdmin } from "@/lib/auth/session";

/**
 * Serves uploaded media at /media/<uuid>.<ext>.
 * Only files that exist in the media library and are not in the trash are
 * served; the stored MIME type (verified at upload) is always used.
 * Byte ranges are supported, which Safari and iOS need to play videos.
 */
export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
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
  const headers: Record<string, string> = {
    "Content-Type": media.mimeType,
    "Content-Disposition": disposition,
    "Accept-Ranges": "bytes",
    // Keys are unique per upload, so a file never changes at the same URL.
    "Cache-Control": isPrivate ? "private, no-store" : "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  };

  const range = parseRange(request.headers.get("range"), data.length);
  if (range === "invalid") {
    return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${data.length}` } });
  }
  if (range) {
    const [start, end] = range;
    return new Response(new Uint8Array(data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${data.length}` },
    });
  }
  return new Response(new Uint8Array(data), { headers: { ...headers, "Content-Length": String(data.length) } });
}

/** "bytes=0-1023" → [0, 1023]; null when absent or unusable (send the whole file). */
function parseRange(header: string | null, size: number): [number, number] | "invalid" | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (!m[1] && !m[2])) return null; // several ranges or odd syntax: whole file
  let start: number;
  let end: number;
  if (!m[1]) {
    // Suffix range: the last N bytes.
    const n = Number(m[2]);
    if (n === 0) return "invalid";
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  }
  if (start >= size || start > end) return "invalid";
  return [start, end];
}
