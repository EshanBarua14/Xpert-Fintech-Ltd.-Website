import type { PrismaClient } from "@prisma/client";

type SeedImage = (folder: string, key: string, name: string, tags: string[]) => Promise<string | null>;

/**
 * Once: prisma/seed-media/products/trading-platform-logo.png goes into the media
 * library and becomes the Trading OMS product logo (shown on its product tiles).
 * A later change in Admin -> Products is kept.
 */
export async function seedOmsLogo(db: PrismaClient, seedImage: SeedImage) {
  const MARK = "seed.oms-logo-2026-10-12";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const id = await seedImage("products", "trading-platform-logo", "Xpert Trading OMS logo", ["logo"]);
  if (!id) {
    console.log("• OMS logo: prisma/seed-media/products/trading-platform-logo.png not found");
    return;
  }
  const o = await db.offering.findUnique({ where: { key: "trading-platform" }, select: { id: true } });
  if (!o) return;
  await db.offering.update({ where: { id: o.id }, data: { iconMediaId: id } });
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  console.log("• Trading OMS logo set");
}
