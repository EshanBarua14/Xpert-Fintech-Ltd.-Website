import type { PrismaClient } from "@prisma/client";

/* eslint-disable @typescript-eslint/no-explicit-any */

const HREF = "risk-management";

/**
 * Menus: the old "Risk management (RMS)" link (platform#risk) now opens the risk
 * page. A menu with no link to it gets one under Products (header) or beside the
 * Products link (footer). Safe to run again.
 */
export async function seedRiskLinks(db: PrismaClient, EN: any, BN: any) {
  const repointed = await db.navItem.updateMany({ where: { href: "platform#risk" }, data: { href: HREF } });
  let added = 0;
  const products = await db.navItem.findMany({ where: { href: "products" }, orderBy: { sortOrder: "asc" } });
  for (const p of products) {
    if (await db.navItem.findFirst({ where: { menuId: p.menuId, href: HREF } })) continue;
    let parentId: string | null;
    let after: number;
    if (p.parentId === null) {
      const kids = await db.navItem.findMany({ where: { parentId: p.id }, orderBy: { sortOrder: "asc" } });
      if (!kids.length) continue;
      parentId = p.id;
      const anchor = kids.find((k) => k.href === "platform") ?? kids[kids.length - 1]!;
      after = anchor.sortOrder;
    } else {
      parentId = p.parentId;
      after = p.sortOrder;
    }
    await db.navItem.updateMany({
      where: { menuId: p.menuId, parentId, sortOrder: { gt: after } },
      data: { sortOrder: { increment: 1 } },
    });
    await db.navItem.create({
      data: {
        menuId: p.menuId,
        parentId,
        linkType: "INTERNAL",
        href: HREF,
        sortOrder: after + 1,
        translations: {
          create: [
            { locale: EN, label: "Risk checks", description: "Short-sell, margin, limit and exposure checks on every order." },
            { locale: BN, label: "ঝুঁকি যাচাই", description: "প্রতিটি অর্ডারে শর্ট সেল, মার্জিন, সীমা ও এক্সপোজার যাচাই।" },
          ],
        },
      },
    });
    added++;
  }
  if (repointed.count || added) console.log("- Risk checks link: " + repointed.count + " repointed, " + added + " added");
}
