"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { navItemSchema } from "@/lib/validation/navigation";

export type NavState = { errors?: FieldErrors; message?: string; savedAt?: number };

const uuid = z.string().uuid();

async function refresh(menuId: string) {
  const menu = await db.navMenu.findUnique({ where: { id: menuId }, select: { key: true } });
  revalidatePath("/", "layout");
  if (menu) revalidatePath(`/admin/navigation/${menu.key}`);
}

export async function saveNavItem(_prev: NavState, formData: FormData): Promise<NavState> {
  await requireAdmin();
  const parsed = navItemSchema.safeParse({
    menuId: formData.get("menuId"),
    itemId: formData.get("itemId") || undefined,
    parentId: formData.get("parentId") ?? "",
    linkType: formData.get("linkType"),
    internalHref: formData.get("internalHref") ?? "",
    externalHref: formData.get("externalHref") ?? "",
    enLabel: formData.get("enLabel") ?? "",
    bnLabel: formData.get("bnLabel") ?? "",
    enDescription: formData.get("enDescription") ?? "",
    bnDescription: formData.get("bnDescription") ?? "",
    openInNewTab: formData.get("openInNewTab"),
    isCta: formData.get("isCta"),
    isHidden: formData.get("isHidden"),
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error) };
  const v = parsed.data;

  if (v.parentId) {
    const parent = await db.navItem.findUnique({ where: { id: v.parentId } });
    // Two levels only: a heading/link and the links under it.
    if (!parent || parent.menuId !== v.menuId || parent.parentId) {
      return { errors: { parentId: "Choose a top-level item as the parent." } };
    }
    if (parent.id === v.itemId) return { errors: { parentId: "An item cannot be its own parent." } };
    if (v.itemId && (await db.navItem.count({ where: { parentId: v.itemId } })) > 0) {
      return { errors: { parentId: "This item has sub-items, so it must stay at the top level." } };
    }
  }

  const data = {
    parentId: v.parentId,
    linkType: v.linkType,
    href: v.linkType === "INTERNAL" ? v.internalHref : v.linkType === "EXTERNAL" ? v.externalHref : null,
    openInNewTab: v.linkType === "EXTERNAL" ? v.openInNewTab : false,
    isCta: v.isCta,
    isHidden: v.isHidden,
  };

  await db.$transaction(async (tx) => {
    let id = v.itemId;
    if (id) {
      await tx.navItem.update({ where: { id }, data });
    } else {
      const last = await tx.navItem.aggregate({
        where: { menuId: v.menuId, parentId: v.parentId },
        _max: { sortOrder: true },
      });
      const created = await tx.navItem.create({
        data: { ...data, menuId: v.menuId, sortOrder: (last._max.sortOrder ?? -1) + 1 },
      });
      id = created.id;
    }
    await tx.navItemTranslation.upsert({
      where: { itemId_locale: { itemId: id, locale: "en" } },
      update: { label: v.enLabel, description: v.enDescription ?? null },
      create: { itemId: id, locale: "en", label: v.enLabel, description: v.enDescription ?? null },
    });
    if (v.bnLabel) {
      await tx.navItemTranslation.upsert({
        where: { itemId_locale: { itemId: id, locale: "bn" } },
        update: { label: v.bnLabel, description: v.bnDescription ?? null },
        create: { itemId: id, locale: "bn", label: v.bnLabel, description: v.bnDescription ?? null },
      });
    } else {
      await tx.navItemTranslation.deleteMany({ where: { itemId: id, locale: "bn" } });
    }
  });

  await refresh(v.menuId);
  return { message: "Saved.", savedAt: Date.now() };
}

/** Deletes an item and the links under it. */
export async function deleteNavItem(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("itemId"));
  const item = await db.navItem.delete({ where: { id } });
  await refresh(item.menuId);
}

export async function toggleNavItem(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("itemId"));
  const item = await db.navItem.findUniqueOrThrow({ where: { id } });
  await db.navItem.update({ where: { id }, data: { isHidden: !item.isHidden } });
  await refresh(item.menuId);
}

export async function moveNavItem(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("itemId"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
  const item = await db.navItem.findUniqueOrThrow({ where: { id } });
  const siblings = await db.navItem.findMany({
    where: { menuId: item.menuId, parentId: item.parentId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const index = siblings.findIndex((s) => s.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  const target = siblings[swapWith];
  if (target) {
    const reordered = [...siblings];
    reordered[index] = target;
    reordered[swapWith] = item;
    await db.$transaction(reordered.map((s, i) => db.navItem.update({ where: { id: s.id }, data: { sortOrder: i } })));
  }
  await refresh(item.menuId);
}
