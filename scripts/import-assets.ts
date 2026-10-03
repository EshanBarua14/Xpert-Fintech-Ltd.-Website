/**
 * Bulk-imports real images — consortium logos, people photos and product
 * screenshots — from the ./assets folder into the media library, and links
 * each one to its record. Easier than uploading 30+ files one by one in the admin.
 *
 *   npm run assets:import            import everything new in ./assets
 *   npm run assets:import -- --list  print the keys to name files after
 *   npm run assets:import -- --dry   show what would happen, change nothing
 *
 * Folder layout (file names are record keys; see --list):
 *   assets/logos/<organization-key>.png        e.g. assets/logos/ebl-securities.png
 *   assets/people/<person-key>.jpg             e.g. assets/people/md-shahinur-rahman.jpg
 *   assets/products/<product-key>/hero.png     main product image (product page hero, showcase)
 *   assets/products/<product-key>/<name>.png   screenshots, in name order; the name becomes the caption
 *                                              ("02-order-entry.png" → "Order entry")
 *
 * Accepted: PNG, JPEG, WebP (checked from the file content, like admin uploads).
 * SVG is refused for security; export logos as PNG with a transparent background.
 *
 * Placing a logo in assets/logos records that written permission to show it is on file
 * (logoPermission = true). Only add logos you have permission to display.
 *
 * Re-running is safe: identical files are recognised by checksum and not imported twice.
 * Storage: local driver only (./storage/media), the same place admin uploads go in development.
 */
import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient, type EntityType } from "@prisma/client";
import { sniff } from "../src/lib/media/inspect";

const db = new PrismaClient();
const ROOT = path.join(process.cwd(), "assets");
const STORE = path.join(process.cwd(), "storage", "media");
const DRY = process.argv.includes("--dry");
const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;

const stats = { imported: 0, reused: 0, linked: 0, skipped: [] as string[] };

/** "02-order-entry" → "Order entry" */
function captionFrom(file: string) {
  const base = path.basename(file, path.extname(file)).replace(/^\d+[-_ ]*/, "").replace(/[-_]+/g, " ").trim();
  return base ? base[0]!.toUpperCase() + base.slice(1) : null;
}

/** Stores the file in the media library (or finds the identical one) and returns its id. */
async function toMedia(file: string, altText: string): Promise<string | null> {
  const data = await readFile(file);
  const type = sniff(data);
  if (!type || type.kind !== "IMAGE" || type.ext === "gif") {
    stats.skipped.push(`${path.relative(ROOT, file)}: not a PNG, JPEG or WebP image`);
    return null;
  }
  if (data.length > 10 * 1024 * 1024) {
    stats.skipped.push(`${path.relative(ROOT, file)}: larger than 10 MB`);
    return null;
  }
  const checksum = createHash("sha256").update(data).digest("hex");
  const existing = await db.media.findFirst({ where: { checksum, deletedAt: null }, select: { id: true } });
  if (existing) {
    stats.reused++;
    return existing.id;
  }
  if (DRY) {
    stats.imported++;
    return "dry-run";
  }
  const storageKey = `${randomUUID()}.${type.ext}`;
  await mkdir(STORE, { recursive: true });
  await writeFile(path.join(STORE, storageKey), data, { flag: "wx" });
  const media = await db.media.create({
    data: {
      kind: "IMAGE",
      storageKey,
      originalName: path.basename(file),
      mimeType: type.mimeType,
      sizeBytes: data.length,
      width: type.width ?? null,
      height: type.height ?? null,
      checksum,
      isScanned: true,
      tags: ["imported"],
      translations: { create: { locale: "en", altText } },
    },
  });
  stats.imported++;
  return media.id;
}

async function recordUsage(mediaId: string, entityType: EntityType, entityId: string, field: string) {
  if (DRY) return;
  await db.mediaUsage.deleteMany({ where: { entityType, entityId, field } });
  await db.mediaUsage.create({ data: { mediaId, entityType, entityId, field } });
}

async function images(dir: string) {
  if (!existsSync(dir)) return [];
  return (await readdir(dir)).filter((f) => IMAGE_EXT.test(f) || /\.svg$/i.test(f)).sort();
}

async function importLogos() {
  for (const file of await images(path.join(ROOT, "logos"))) {
    const key = path.basename(file, path.extname(file));
    if (/\.svg$/i.test(file)) {
      stats.skipped.push(`logos/${file}: SVG is not accepted — export it as PNG`);
      continue;
    }
    const org = await db.organization.findUnique({ where: { key }, include: { translations: true } });
    if (!org) {
      stats.skipped.push(`logos/${file}: no organization with key "${key}" (see --list)`);
      continue;
    }
    const name = org.translations.find((t) => t.locale === "en")?.name ?? key;
    const mediaId = await toMedia(path.join(ROOT, "logos", file), `${name} logo`);
    if (!mediaId) continue;
    if (!DRY) await db.organization.update({ where: { id: org.id }, data: { logoMediaId: mediaId, logoPermission: true } });
    await recordUsage(mediaId, "ORGANIZATION", org.id, "logo");
    stats.linked++;
  }
}

async function importPeople() {
  for (const file of await images(path.join(ROOT, "people"))) {
    const key = path.basename(file, path.extname(file));
    if (/\.svg$/i.test(file)) {
      stats.skipped.push(`people/${file}: use a JPEG or PNG photo`);
      continue;
    }
    const person = await db.person.findUnique({ where: { key }, include: { translations: true } });
    if (!person) {
      stats.skipped.push(`people/${file}: no person with key "${key}" (see --list)`);
      continue;
    }
    const name = person.translations.find((t) => t.locale === "en")?.name ?? key;
    const mediaId = await toMedia(path.join(ROOT, "people", file), name);
    if (!mediaId) continue;
    if (!DRY) await db.person.update({ where: { id: person.id }, data: { photoMediaId: mediaId } });
    await recordUsage(mediaId, "PERSON", person.id, "photo");
    stats.linked++;
  }
}

async function importProducts() {
  const dir = path.join(ROOT, "products");
  if (!existsSync(dir)) return;
  for (const key of (await readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)) {
    const offering = await db.offering.findUnique({ where: { key }, include: { translations: true, media: true } });
    if (!offering) {
      stats.skipped.push(`products/${key}/: no product with key "${key}" (see --list)`);
      continue;
    }
    const name = offering.translations.find((t) => t.locale === "en")?.name ?? key;
    let order = offering.media.length;
    for (const file of await images(path.join(dir, key))) {
      if (/\.svg$/i.test(file)) {
        stats.skipped.push(`products/${key}/${file}: export screenshots as PNG`);
        continue;
      }
      const isHero = /^hero\./i.test(file);
      const caption = isHero ? null : captionFrom(file);
      const mediaId = await toMedia(path.join(dir, key, file), caption ? `${name} — ${caption}` : `${name} interface`);
      if (!mediaId) continue;
      if (isHero) {
        if (!DRY) await db.offering.update({ where: { id: offering.id }, data: { heroMediaId: mediaId } });
        await recordUsage(mediaId, "OFFERING", offering.id, "hero");
      } else {
        if (offering.media.some((m) => m.mediaId === mediaId)) continue; // already attached
        if (!DRY) {
          const row = await db.offeringMedia.create({
            data: {
              offeringId: offering.id,
              kind: "SCREENSHOT",
              mediaId,
              sortOrder: order++,
              ...(caption ? { translations: { create: { locale: "en" as const, caption } } } : {}),
            },
          });
          await recordUsage(mediaId, "OFFERING", offering.id, `screenshot:${row.id}`);
        }
      }
      stats.linked++;
    }
  }
}

async function list() {
  const [orgs, people, offerings] = await Promise.all([
    db.organization.findMany({ where: { deletedAt: null }, orderBy: [{ kind: "asc" }, { sortOrder: "asc" }], include: { translations: true } }),
    db.person.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, include: { translations: true, roles: true } }),
    db.offering.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, include: { translations: true } }),
  ]);
  const en = (rows: { locale: string; name: string }[]) => rows.find((t) => t.locale === "en")?.name ?? "";
  console.log("\nassets/logos/<key>.png");
  for (const o of orgs) console.log(`  ${(o.key ?? "(no key)").padEnd(28)} ${en(o.translations)}${o.logoMediaId ? "  [has logo]" : ""}`);
  console.log("\nassets/people/<key>.jpg");
  for (const p of people) console.log(`  ${(p.key ?? "(no key)").padEnd(34)} ${en(p.translations)} (${p.roles.map((r) => r.group).join(", ")})${p.photoMediaId ? "  [has photo]" : ""}`);
  console.log("\nassets/products/<key>/hero.png and screenshots");
  for (const o of offerings) console.log(`  ${(o.key ?? "(no key)").padEnd(24)} ${en(o.translations)}  [${o.status}]`);
}

async function main() {
  if (process.argv.includes("--list")) return list();
  if (!existsSync(ROOT)) {
    console.log("No ./assets folder. See assets/README.md for the layout.");
    return;
  }
  await importLogos();
  await importPeople();
  await importProducts();
  console.log(`${DRY ? "[dry run] " : ""}Imported ${stats.imported} new image(s), reused ${stats.reused}, linked ${stats.linked}.`);
  if (stats.skipped.length) console.log(`Skipped:\n  ${stats.skipped.join("\n  ")}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
