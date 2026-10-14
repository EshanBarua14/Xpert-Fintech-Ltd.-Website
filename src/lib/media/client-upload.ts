/**
 * Browser-side help for uploads.
 *
 * Hosts such as Vercel accept at most about 4.5 MB per request, so files are
 * sent one request at a time, and a photo larger than that is made smaller in
 * the browser first (longest side 2,560 px, WebP), which keeps it sharp on any
 * screen. PDFs and videos cannot be made smaller here: when one is over the
 * limit the editor is told what to do instead.
 */

/** Bytes one upload request may carry on this host (set by the server page; 4 MB when unknown). */
export const DEFAULT_REQUEST_BYTES = 4 * 1024 * 1024;

const SHRINKABLE = /^image\/(png|jpeg|webp)$/;

async function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/webp", quality));
}

/**
 * The file itself when it fits in `maxBytes`; otherwise, for PNG, JPEG and WebP
 * photos, a smaller WebP copy. Returns null when it cannot be made to fit.
 */
export async function fitForUpload(file: File, maxBytes: number): Promise<File | null> {
  if (file.size <= maxBytes) return file;
  if (!SHRINKABLE.test(file.type) || typeof createImageBitmap !== "function") return null;
  try {
    const bitmap = await createImageBitmap(file);
    let side = Math.min(2560, Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 5; attempt++) {
      const scale = side / Math.max(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await toBlob(canvas, attempt < 2 ? 0.86 : 0.78);
      if (blob && blob.size <= maxBytes) {
        bitmap.close?.();
        return new File([blob], file.name.replace(/\.(png|jpe?g|webp)$/i, "") + ".webp", { type: "image/webp" });
      }
      side = Math.round(side * 0.8);
    }
    bitmap.close?.();
  } catch {
    /* the browser could not read the image */
  }
  return null;
}

export const mbText = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
