"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type BlockType } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { isUsableImage, syncMediaUsage } from "@/lib/admin/media";
import { checkbox, optionalId, optionalText, parseLocalDateTime, toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { blockDefinition, readSettings, settingsSchema } from "@/content/blocks/registry";
import { purgePage } from "@/lib/admin/purge";

export type PageState = { errors?: FieldErrors; message?: string; savedAt?: number };

const uuid = z.string().uuid();

/** "company/about" — lowercase words separated by / ; "" only for the home page. */
const pagePath = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v) => v.replace(/^\/+|\/+$/g, ""))
  .pipe(z.string().max(200).regex(/^([a-z0-9]+(-[a-z0-9]+)*)(\/[a-z0-9]+(-[a-z0-9]+)*)*$|^$/, "Use lowercase words separated by /, e.g. company/about"));

function refresh(pageId?: string) {
  revalidatePath("/", "layout");
  if (pageId) revalidatePath(`/admin/pages/${pageId}`);
}

async function pageIdOfSection(sectionId: string) {
  return (await db.pageSection.findUniqueOrThrow({ where: { id: sectionId }, select: { pageId: true } })).pageId;
}
async function pageIdOfBlock(blockId: string) {
  const b = await db.contentBlock.findUniqueOrThrow({ where: { id: blockId }, select: { section: { select: { pageId: true } } } });
  return b.section.pageId;
}

/** Moves one row up or down among its siblings and rewrites 0..n orders. */
function reorder<T extends { id: string }>(siblings: T[], id: string, direction: "up" | "down"): T[] | null {
  const i = siblings.findIndex((s) => s.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= siblings.length) return null;
  const out = [...siblings];
  [out[i], out[j]] = [out[j]!, out[i]!];
  return out;
}

// ── Page settings & SEO ──────────────────────────────────────────────────────

const pageSchema = z.object({
  id: z.string().uuid().optional(),
  template: z.enum(["default", "landing", "legal"]),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  showInSearch: checkbox,
  ogImageId: optionalId,
  enTitle: z.string().trim().min(1, "English title is required.").max(160),
  enPath: pagePath,
  enIntro: optionalText(600),
  enSeoTitle: optionalText(70),
  enSeoDescription: optionalText(170),
  bnTitle: z.string().trim().max(160),
  bnPath: pagePath,
  bnIntro: optionalText(600),
  bnSeoTitle: optionalText(70),
  bnSeoDescription: optionalText(170),
});

export async function savePage(_prev: PageState, formData: FormData): Promise<PageState> {
  const admin = await requireAdmin();
  const parsed = pageSchema.safeParse(
    Object.fromEntries(Object.keys(pageSchema.shape).map((k) => [k, formData.get(k) ?? (k === "id" || k === "publishAt" ? undefined : "")])),
  );
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;

  const existing = v.id ? await db.page.findUnique({ where: { id: v.id }, select: { key: true } }) : null;
  const isHome = existing?.key === "home";
  if (!isHome && !v.enPath) return { errors: { enPath: "Enter the page address, e.g. company/about" } };
  if (!(await isUsableImage(v.ogImageId))) return { errors: { ogImageId: "That image is no longer in the media library." } };
  const bnPath = isHome ? "" : v.bnPath || v.enPath;

  const data = {
    template: v.template,
    status: v.status,
    publishAt: parseLocalDateTime(v.publishAt),
    showInSearch: v.showInSearch,
    updatedById: admin.id,
  };

  let id = v.id;
  try {
    await db.$transaction(async (tx) => {
      if (id) await tx.page.update({ where: { id }, data });
      else id = (await tx.page.create({ data: { ...data, createdById: admin.id } })).id;
      const pageId = id!;

      const langs = [
        { locale: "en" as const, title: v.enTitle, path: isHome ? "" : v.enPath, intro: v.enIntro, seoTitle: v.enSeoTitle, seoDescription: v.enSeoDescription },
        ...(v.bnTitle
          ? [{ locale: "bn" as const, title: v.bnTitle, path: bnPath, intro: v.bnIntro, seoTitle: v.bnSeoTitle, seoDescription: v.bnSeoDescription }]
          : []),
      ];
      if (!v.bnTitle) {
        await tx.pageTranslation.deleteMany({ where: { pageId, locale: "bn" } });
        await tx.seoMetadata.deleteMany({ where: { entityType: "PAGE", entityId: pageId, locale: "bn" } });
      }
      for (const l of langs) {
        await tx.pageTranslation.upsert({
          where: { pageId_locale: { pageId, locale: l.locale } },
          update: { title: l.title, path: l.path, intro: l.intro ?? null },
          create: { pageId, locale: l.locale, title: l.title, path: l.path, intro: l.intro ?? null },
        });
        const seo = { title: l.seoTitle ?? null, description: l.seoDescription ?? null, ogImageId: v.ogImageId };
        await tx.seoMetadata.upsert({
          where: { entityType_entityId_locale: { entityType: "PAGE", entityId: pageId, locale: l.locale } },
          update: seo,
          create: { entityType: "PAGE", entityId: pageId, locale: l.locale, ...seo, keywords: [] },
        });
      }
      await syncMediaUsage(tx, "PAGE", pageId, "ogImage", v.ogImageId);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { enPath: "Another page already uses this address." }, message: "That address is taken." };
    }
    console.error("[admin] savePage failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh(id);
  if (!v.id) redirect(`/admin/pages/${id}?saved=1`);
  return { message: "Page settings saved.", savedAt: Date.now() };
}

export async function trashPage(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.page.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  refresh();
  redirect("/admin/pages?trashed=1");
}

export async function restorePage(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.page.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  refresh(id);
  redirect(`/admin/pages/${id}?restored=1`);
}

/** Permanent delete, from the trash only. System pages (home, about…) cannot be deleted. */
export async function deletePageForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const page = await db.page.findUnique({ where: { id }, select: { deletedAt: true, key: true } });
  if (!page?.deletedAt || page.key) redirect(`/admin/pages/${id}`);
  await purgePage(id);
  refresh();
  redirect("/admin/pages?view=trash&deleted=1");
}

// ── Sections ─────────────────────────────────────────────────────────────────

export async function addSection(formData: FormData) {
  await requireAdmin();
  const pageId = uuid.parse(formData.get("pageId"));
  const last = await db.pageSection.aggregate({ where: { pageId }, _max: { sortOrder: true } });
  await db.pageSection.create({ data: { pageId, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
  refresh(pageId);
}

const sectionSchema = z.object({
  sectionId: z.string().uuid(),
  variant: z.enum(["dark", "light", "grid", "full-bleed"]),
  anchorId: z
    .string()
    .trim()
    .toLowerCase()
    .max(40)
    .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and -")
    .transform((v) => v || null),
});

export async function saveSection(_prev: PageState, formData: FormData): Promise<PageState> {
  await requireAdmin();
  const parsed = sectionSchema.safeParse({
    sectionId: formData.get("sectionId"),
    variant: formData.get("variant"),
    anchorId: formData.get("anchorId") ?? "",
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error) };
  const s = await db.pageSection.update({
    where: { id: parsed.data.sectionId },
    data: { variant: parsed.data.variant, anchorId: parsed.data.anchorId },
  });
  refresh(s.pageId);
  return { message: "Saved.", savedAt: Date.now() };
}

export async function toggleSection(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("sectionId"));
  const s = await db.pageSection.findUniqueOrThrow({ where: { id } });
  await db.pageSection.update({ where: { id }, data: { isHidden: !s.isHidden } });
  refresh(s.pageId);
}

export async function moveSection(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("sectionId"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
  const s = await db.pageSection.findUniqueOrThrow({ where: { id } });
  const siblings = await db.pageSection.findMany({ where: { pageId: s.pageId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const next = reorder(siblings, id, direction);
  if (next) await db.$transaction(next.map((x, i) => db.pageSection.update({ where: { id: x.id }, data: { sortOrder: i } })));
  refresh(s.pageId);
}

export async function deleteSection(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("sectionId"));
  const s = await db.pageSection.findUniqueOrThrow({ where: { id }, include: { blocks: { include: { items: true } } } });
  await db.$transaction(async (tx) => {
    for (const b of s.blocks) {
      for (const item of b.items) await tx.mediaUsage.deleteMany({ where: { entityType: "PAGE", entityId: item.id } });
    }
    await tx.pageSection.delete({ where: { id } });
  });
  refresh(s.pageId);
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export async function addBlock(formData: FormData) {
  const admin = await requireAdmin();
  const sectionId = uuid.parse(formData.get("sectionId"));
  const type = z.string().parse(formData.get("type"));
  const def = blockDefinition(type);
  if (!def) throw new Error("Unknown block type");
  const defaults = Object.fromEntries(def.settings.map((s) => [s.key, s.default]));
  const last = await db.contentBlock.aggregate({ where: { sectionId }, _max: { sortOrder: true } });
  await db.contentBlock.create({
    data: {
      sectionId,
      type: type as BlockType,
      props: defaults,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });
  refresh(await pageIdOfSection(sectionId));
}

const blockText = {
  eyebrow: optionalText(80),
  title: optionalText(200),
  subtitle: optionalText(600),
  body: optionalText(20000),
  ctaLabel: optionalText(40),
  ctaHref: optionalText(300),
};
const blockTextSchema = z.object(blockText);

export async function saveBlock(_prev: PageState, formData: FormData): Promise<PageState> {
  const admin = await requireAdmin();
  const blockId = uuid.parse(formData.get("blockId"));
  const block = await db.contentBlock.findUniqueOrThrow({ where: { id: blockId }, include: { section: true } });
  const def = blockDefinition(block.type);
  if (!def) return { message: "This block type is no longer supported." };

  const status = z.enum(["DRAFT", "PUBLISHED"]).safeParse(formData.get("status"));
  if (!status.success) return { errors: { status: "Choose Draft or Published." } };
  const settings = settingsSchema(def.settings).safeParse(readSettings(formData, def.settings, "setting"));
  if (!settings.success) return { errors: toFieldErrors(settings.error), message: "Please fix the highlighted fields." };

  const texts = {} as Record<"en" | "bn", z.infer<typeof blockTextSchema>>;
  for (const l of ["en", "bn"] as const) {
    const parsed = blockTextSchema.safeParse(
      Object.fromEntries(Object.keys(blockText).map((k) => [k, formData.get(`${l}.${k}`) ?? ""])),
    );
    if (!parsed.success) {
      const errs = toFieldErrors(parsed.error);
      return { errors: Object.fromEntries(Object.entries(errs).map(([k, m]) => [`${l}.${k}`, m])) };
    }
    texts[l] = parsed.data;
  }
  if (texts.en.ctaLabel && !texts.en.ctaHref) return { errors: { "en.ctaHref": "Add where the button goes." } };

  await db.$transaction(async (tx) => {
    await tx.contentBlock.update({
      where: { id: blockId },
      data: {
        props: settings.data as Prisma.InputJsonValue,
        status: status.data,
        publishAt: parseLocalDateTime((formData.get("publishAt") as string) || undefined),
        isHidden: formData.get("isHidden") === "on",
        updatedById: admin.id,
      },
    });
    for (const l of ["en", "bn"] as const) {
      const t = texts[l];
      const hasText = Object.values(t).some(Boolean);
      if (!hasText && l === "bn") {
        await tx.contentBlockTranslation.deleteMany({ where: { blockId, locale: "bn" } });
        continue;
      }
      const data = {
        eyebrow: t.eyebrow ?? null,
        title: t.title ?? null,
        subtitle: t.subtitle ?? null,
        body: t.body ?? null,
        ctaLabel: t.ctaLabel ?? null,
        ctaHref: t.ctaHref ?? (l === "bn" ? texts.en.ctaHref ?? null : null),
      };
      await tx.contentBlockTranslation.upsert({
        where: { blockId_locale: { blockId, locale: l } },
        update: data,
        create: { blockId, locale: l, ...data },
      });
    }
  });
  refresh(block.section.pageId);
  return { message: "Block saved.", savedAt: Date.now() };
}

export async function moveBlock(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("blockId"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
  const b = await db.contentBlock.findUniqueOrThrow({ where: { id } });
  const siblings = await db.contentBlock.findMany({ where: { sectionId: b.sectionId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const next = reorder(siblings, id, direction);
  if (next) await db.$transaction(next.map((x, i) => db.contentBlock.update({ where: { id: x.id }, data: { sortOrder: i } })));
  refresh(await pageIdOfSection(b.sectionId));
}

export async function deleteBlock(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("blockId"));
  const pageId = await pageIdOfBlock(id);
  const items = await db.blockItem.findMany({ where: { blockId: id }, select: { id: true } });
  await db.$transaction(async (tx) => {
    for (const item of items) await tx.mediaUsage.deleteMany({ where: { entityType: "PAGE", entityId: item.id } });
    await tx.contentBlock.delete({ where: { id } });
  });
  refresh(pageId);
}

// ── Cards (block items) ──────────────────────────────────────────────────────

const itemText = { title: optionalText(200), subtitle: optionalText(200), body: optionalText(4000), ctaLabel: optionalText(40) };
const itemTextSchema = z.object(itemText);

export async function saveItem(_prev: PageState, formData: FormData): Promise<PageState> {
  await requireAdmin();
  const blockId = uuid.parse(formData.get("blockId"));
  const itemId = formData.get("itemId") ? uuid.parse(formData.get("itemId")) : null;
  const block = await db.contentBlock.findUniqueOrThrow({ where: { id: blockId }, include: { section: true } });
  const def = blockDefinition(block.type);
  if (!def?.cards) return { message: "This block has no cards." };

  const mediaId = optionalId.safeParse(formData.get("mediaId") ?? "");
  if (!mediaId.success || !(await isUsableImage(mediaId.data))) return { errors: { mediaId: "Choose an image from the library." } };
  const linkUrl = z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null)
    .parse(formData.get("linkUrl") ?? "");
  const iconName = z
    .string()
    .trim()
    .max(40)
    .regex(/^[a-z0-9-]*$/)
    .catch("")
    .transform((v) => v || null)
    .parse(formData.get("iconName") ?? "");
  const cardSettings = settingsSchema(def.cards.settings ?? []).safeParse(readSettings(formData, def.cards.settings ?? [], "cardSetting"));
  if (!cardSettings.success) return { errors: toFieldErrors(cardSettings.error) };

  const texts = {} as Record<"en" | "bn", z.infer<typeof itemTextSchema>>;
  for (const l of ["en", "bn"] as const) {
    const parsed = itemTextSchema.safeParse(Object.fromEntries(Object.keys(itemText).map((k) => [k, formData.get(`${l}.${k}`) ?? ""])));
    if (!parsed.success) return { errors: Object.fromEntries(Object.entries(toFieldErrors(parsed.error)).map(([k, m]) => [`${l}.${k}`, m])) };
    texts[l] = parsed.data;
  }
  if (!Object.values(texts.en).some(Boolean) && !mediaId.data) return { errors: { "en.title": "Add some English text or an image." } };

  await db.$transaction(async (tx) => {
    const data = { mediaId: mediaId.data, linkUrl, iconName, props: cardSettings.data as Prisma.InputJsonValue };
    let id = itemId;
    if (id) await tx.blockItem.update({ where: { id }, data });
    else {
      const last = await tx.blockItem.aggregate({ where: { blockId }, _max: { sortOrder: true } });
      id = (await tx.blockItem.create({ data: { ...data, blockId, sortOrder: (last._max.sortOrder ?? -1) + 1 } })).id;
    }
    for (const l of ["en", "bn"] as const) {
      const t = texts[l];
      if (!Object.values(t).some(Boolean) && l === "bn") {
        await tx.blockItemTranslation.deleteMany({ where: { itemId: id, locale: "bn" } });
        continue;
      }
      const row = { title: t.title ?? null, subtitle: t.subtitle ?? null, body: t.body ?? null, ctaLabel: t.ctaLabel ?? null };
      await tx.blockItemTranslation.upsert({
        where: { itemId_locale: { itemId: id, locale: l } },
        update: row,
        create: { itemId: id, locale: l, ...row },
      });
    }
    // Card images are tracked against the page, keyed by the card id.
    await syncMediaUsage(tx, "PAGE", id, "card", mediaId.data);
  });
  refresh(block.section.pageId);
  return { message: "Saved.", savedAt: Date.now() };
}

export async function toggleItem(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("itemId"));
  const item = await db.blockItem.findUniqueOrThrow({ where: { id } });
  await db.blockItem.update({ where: { id }, data: { isHidden: !item.isHidden } });
  refresh(await pageIdOfBlock(item.blockId));
}

export async function moveItem(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("itemId"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
  const item = await db.blockItem.findUniqueOrThrow({ where: { id } });
  const siblings = await db.blockItem.findMany({ where: { blockId: item.blockId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const next = reorder(siblings, id, direction);
  if (next) await db.$transaction(next.map((x, i) => db.blockItem.update({ where: { id: x.id }, data: { sortOrder: i } })));
  refresh(await pageIdOfBlock(item.blockId));
}

export async function deleteItem(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("itemId"));
  const item = await db.blockItem.findUniqueOrThrow({ where: { id } });
  await db.$transaction([
    db.mediaUsage.deleteMany({ where: { entityType: "PAGE", entityId: id } }),
    db.blockItem.delete({ where: { id } }),
  ]);
  refresh(await pageIdOfBlock(item.blockId));
}
