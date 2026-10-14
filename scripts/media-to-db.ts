/**
 * Copies the files in storage/media into the database (table StoredFile), so a
 * site that keeps uploads in the database (STORAGE_DRIVER=database, used on
 * Vercel) has every file the media library lists. Files already copied are
 * skipped; nothing is deleted. Run it against the database the live site uses:
 *
 *   npm run media:to-db
 *
 * Useful after importing or seeding on your own computer (those write files to
 * storage/media) when the live site reads from the database.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|gif|pdf|mp4|webm)$/;

async function main() {
  const dir = path.join(process.cwd(), "storage", "media");
  const files = (await readdir(dir).catch(() => [] as string[])).filter((f) => KEY.test(f));
  const have = new Set((await db.storedFile.findMany({ select: { key: true } })).map((r) => r.key));
  let copied = 0;
  let bytes = 0;
  for (const key of files) {
    if (have.has(key)) continue;
    const data = await readFile(path.join(dir, key));
    await db.storedFile.create({ data: { key, data: new Uint8Array(data), size: data.length } });
    copied++;
    bytes += data.length;
  }
  console.log(`✔ ${copied} file(s) copied into the database (${(bytes / 1024 / 1024).toFixed(1)} MB); ${files.length - copied} were already there.`);
  // Library entries whose file is in neither place (shown as broken images on the site).
  const media = await db.media.findMany({ where: { deletedAt: null }, select: { storageKey: true, originalName: true } });
  const onDisk = new Set(files);
  const missing = media.filter((m) => !onDisk.has(m.storageKey) && !have.has(m.storageKey));
  if (missing.length) {
    console.log(`\n! ${missing.length} media library item(s) have no file anywhere. Upload them again in Admin → Media:`);
    for (const m of missing.slice(0, 30)) console.log(`  - ${m.originalName} (${m.storageKey})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
