/**
 * Identifies an uploaded file by its content (magic bytes), never by its name
 * or the browser-reported type, and reads image dimensions without extra
 * libraries.
 *
 * Accepted: PNG, JPEG, WebP, GIF images, PDF documents and short MP4/WebM
 * videos. Not accepted: SVG (it can carry scripts), HTML, executables,
 * archives. Long videos are better added as YouTube/Vimeo/Facebook links.
 */
export type Sniffed = {
  kind: "IMAGE" | "DOCUMENT" | "VIDEO";
  ext: "png" | "jpg" | "webp" | "gif" | "pdf" | "mp4" | "webm";
  mimeType: string;
  width?: number;
  height?: number;
};

// Uploads travel through a server action limited to 50 MB (next.config.ts).
export const MAX_BYTES = { IMAGE: 10 * 1024 * 1024, DOCUMENT: 25 * 1024 * 1024, VIDEO: 45 * 1024 * 1024 } as const;

const ascii = (b: Buffer, start: number, end: number) => b.toString("latin1", start, end);

function jpegSize(b: Buffer): { width: number; height: number } | undefined {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return undefined;
    const marker = b[i + 1]!;
    const length = b.readUInt16BE(i + 2);
    // SOF0–SOF15 carry the size, except DHT (C4), JPG (C8) and DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + length;
  }
  return undefined;
}

function webpSize(b: Buffer): { width: number; height: number } | undefined {
  const chunk = ascii(b, 12, 16);
  if (chunk === "VP8 " && b.length >= 30) return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (chunk === "VP8L" && b.length >= 25) {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X" && b.length >= 30) {
    return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  }
  return undefined;
}

export function sniff(b: Buffer): Sniffed | null {
  if (b.length < 16) return null;
  if (b[0] === 0x89 && ascii(b, 1, 4) === "PNG") {
    return { kind: "IMAGE", ext: "png", mimeType: "image/png", width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { kind: "IMAGE", ext: "jpg", mimeType: "image/jpeg", ...jpegSize(b) };
  }
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") {
    return { kind: "IMAGE", ext: "webp", mimeType: "image/webp", ...webpSize(b) };
  }
  if (ascii(b, 0, 4) === "GIF8") {
    return { kind: "IMAGE", ext: "gif", mimeType: "image/gif", width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  }
  if (ascii(b, 0, 5) === "%PDF-") {
    return { kind: "DOCUMENT", ext: "pdf", mimeType: "application/pdf" };
  }
  // ISO base media ("ftyp" box first): MP4 and its common brands. QuickTime
  // (.mov, brand "qt  ") is refused because most browsers cannot play it.
  if (ascii(b, 4, 8) === "ftyp") {
    const brand = ascii(b, 8, 12);
    if (/^(isom|iso[2-9]|mp41|mp42|avc1|dash|M4V |MSNV)$/.test(brand)) return { kind: "VIDEO", ext: "mp4", mimeType: "video/mp4" };
    return null;
  }
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 && ascii(b, 0, 64).includes("webm")) {
    return { kind: "VIDEO", ext: "webm", mimeType: "video/webm" };
  }
  return null;
}

/** "Annual Report (final).PDF" → "Annual Report (final).pdf", safe to display. */
export function cleanFileName(name: string): string {
  const base = name.replace(/[\\/]/g, "_").replace(/[^\p{L}\p{N} ._()-]/gu, "").trim();
  return (base || "file").slice(0, 150);
}
