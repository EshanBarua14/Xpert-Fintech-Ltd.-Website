"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { isUsableImage, syncMediaUsage } from "@/lib/admin/media";
import { formInput, splitList } from "@/lib/admin/forms";
import { purgeArticle } from "@/lib/admin/purge";
import { optionalId, optionalText, parseLocalDateTime, slugField, slugify, toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { parseDateOnly } from "@/lib/validation/organizations";

export type ArticleState = { errors?: FieldErrors; message?: string };

const schema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  displayDate: z.string().optional(),
  authorName: optionalText(120),
  coverMediaId: optionalId,
  categoryId: z.string().uuid().or(z.literal("")).transform((v) => v || null),
  newCategoryEn: optionalText(60),
  newCategoryBn: optionalText(60),
  tags: optionalText(600),
  enTitle: z.string().trim().min(1, "English title is required.").max(200),
  enSlug: slugField,
  enSubtitle: optionalText(300),
  enExcerpt: optionalText(600),
  enBody: optionalText(50000),
  bnTitle: z.string().trim().max(200),
  bnSlug: slugField,
  bnSubtitle: optionalText(300),
  bnExcerpt: optionalText(600),
  bnBody: optionalText(50000),
});

const uuid = z.string().uuid();
const refresh = () => revalidatePath("/", "layout");

/** Finds or creates a category by its English name; returns its id. */
async function ensureCategory(tx: Prisma.TransactionClient, en: string, bn: string | null) {
  const key = slugify(en) || `category-${Date.now()}`;
  const existing = await tx.articleCategory.findUnique({ where: { key } });
  if (existing) return existing.id;
  const max = await tx.articleCategory.aggregate({ _max: { sortOrder: true } });
  const cat = await tx.articleCategory.create({ data: { key, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  await tx.articleCategoryTranslation.create({ data: { categoryId: cat.id, locale: "en", slug: key, name: en } });
  if (bn) await tx.articleCategoryTranslation.create({ data: { categoryId: cat.id, locale: "bn", slug: key, name: bn } });
  return cat.id;
}

export async function saveArticle(_prev: ArticleState, formData: FormData): Promise<ArticleState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(formInput(schema.shape, formData, ["displayDate"]));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  if (!(await isUsableImage(v.coverMediaId))) return { errors: { coverMediaId: "That image is no longer in the media library." } };

  const enSlug = v.enSlug || slugify(v.enTitle);
  if (!enSlug) return { errors: { enSlug: "Enter a URL slug using English letters." } };
  const bnSlug = v.bnSlug || enSlug;
  const tagNames = splitList(v.tags);

  const data = {
    status: v.status,
    publishAt: parseLocalDateTime(v.publishAt),
    sortOrder: v.sortOrder,
    displayDate: parseDateOnly(v.displayDate),
    authorName: v.authorName ?? null,
    coverMediaId: v.coverMediaId,
    updatedById: admin.id,
  };

  let id = v.id;
  try {
    await db.$transaction(async (tx) => {
      const categoryId = v.newCategoryEn ? await ensureCategory(tx, v.newCategoryEn, v.newCategoryBn ?? null) : v.categoryId;
      if (id) await tx.article.update({ where: { id }, data: { ...data, categoryId } });
      else id = (await tx.article.create({ data: { ...data, categoryId, createdById: admin.id } })).id;
      const articleId = id!;

      const en = { slug: enSlug, title: v.enTitle, subtitle: v.enSubtitle ?? null, excerpt: v.enExcerpt ?? null, body: v.enBody ?? null };
      await tx.articleTranslation.upsert({ where: { articleId_locale: { articleId, locale: "en" } }, update: en, create: { articleId, locale: "en", ...en } });
      if (v.bnTitle) {
        const bn = { slug: bnSlug, title: v.bnTitle, subtitle: v.bnSubtitle ?? null, excerpt: v.bnExcerpt ?? null, body: v.bnBody ?? null };
        await tx.articleTranslation.upsert({ where: { articleId_locale: { articleId, locale: "bn" } }, update: bn, create: { articleId, locale: "bn", ...bn } });
      } else {
        await tx.articleTranslation.deleteMany({ where: { articleId, locale: "bn" } });
      }

      // Tags: find or create each by its name, then replace the article's set.
      await tx.articleTag.deleteMany({ where: { articleId } });
      for (const name of tagNames) {
        const key = slugify(name);
        if (!key) continue;
        const tag = await tx.tag.upsert({ where: { key }, update: {}, create: { key } });
        await tx.tagTranslation.upsert({
          where: { tagId_locale: { tagId: tag.id, locale: "en" } },
          update: {},
          create: { tagId: tag.id, locale: "en", slug: key, name },
        });
        await tx.articleTag.create({ data: { articleId, tagId: tag.id } });
      }
      await syncMediaUsage(tx, "ARTICLE", articleId, "cover", v.coverMediaId);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { enSlug: "Another article already uses this URL slug." }, message: "That URL is taken." };
    }
    console.error("[admin] saveArticle failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  redirect(`/admin/news/${id}?saved=1`);
}

export async function trashArticle(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.article.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  refresh();
  redirect("/admin/news?trashed=1");
}

export async function restoreArticle(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.article.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  refresh();
  redirect(`/admin/news/${id}?restored=1`);
}

export async function deleteArticleForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const a = await db.article.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!a?.deletedAt) redirect(`/admin/news/${id}`);
  await purgeArticle(id);
  refresh();
  redirect("/admin/news?view=trash&deleted=1");
}

// ── Categories ───────────────────────────────────────────────────────────────

export type CategoryState = { errors?: FieldErrors; message?: string; savedAt?: number };

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  enName: z.string().trim().min(1, "Enter the English name.").max(60),
  bnName: optionalText(60),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export async function saveCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(formInput(categorySchema.shape, formData));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  const slug = slugify(v.enName);
  if (!slug) return { errors: { enName: "Use English letters for the name." } };
  try {
    await db.$transaction(async (tx) => {
      const id = v.id ?? (await tx.articleCategory.create({ data: { key: slug, sortOrder: v.sortOrder } })).id;
      if (v.id) await tx.articleCategory.update({ where: { id }, data: { sortOrder: v.sortOrder } });
      await tx.articleCategoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: id, locale: "en" } },
        update: { name: v.enName, slug },
        create: { categoryId: id, locale: "en", name: v.enName, slug },
      });
      if (v.bnName) {
        await tx.articleCategoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: id, locale: "bn" } },
          update: { name: v.bnName },
          create: { categoryId: id, locale: "bn", name: v.bnName, slug },
        });
      } else {
        await tx.articleCategoryTranslation.deleteMany({ where: { categoryId: id, locale: "bn" } });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { enName: "A category with this name already exists." } };
    }
    console.error("[admin] saveCategory failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  return { message: "Saved.", savedAt: Date.now() };
}

/** Deletes a category; its articles stay, uncategorised. */
export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.articleCategory.delete({ where: { id } });
  refresh();
  redirect("/admin/news/categories?deleted=1");
}

// ── Tags ─────────────────────────────────────────────────────────────────────

export type TagState = { errors?: FieldErrors; message?: string; savedAt?: number };

const tagSchema = z.object({
  id: z.string().uuid().optional(),
  enName: z.string().trim().min(1, "Enter the English name.").max(60),
  bnName: z.string().trim().max(60),
});

/** Adds a tag, or renames one (its articles keep it). */
export async function saveTag(_prev: TagState, formData: FormData): Promise<TagState> {
  await requireAdmin();
  const parsed = tagSchema.safeParse(formInput(tagSchema.shape, formData));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  const slug = slugify(v.enName);
  if (!slug) return { errors: { enName: "Use English letters for the name." } };
  try {
    await db.$transaction(async (tx) => {
      const id = v.id ?? (await tx.tag.create({ data: { key: slug } })).id;
      await tx.tagTranslation.upsert({
        where: { tagId_locale: { tagId: id, locale: "en" } },
        update: { name: v.enName, slug },
        create: { tagId: id, locale: "en", name: v.enName, slug },
      });
      if (v.bnName) {
        await tx.tagTranslation.upsert({
          where: { tagId_locale: { tagId: id, locale: "bn" } },
          update: { name: v.bnName, slug },
          create: { tagId: id, locale: "bn", name: v.bnName, slug },
        });
      } else {
        await tx.tagTranslation.deleteMany({ where: { tagId: id, locale: "bn" } });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { enName: "A tag with this name already exists." } };
    }
    console.error("[admin] saveTag failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  revalidatePath("/admin/news/tags");
  return { message: "Saved.", savedAt: Date.now() };
}

/** Deletes a tag; it is removed from its articles, which stay as they are. */
export async function deleteTag(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.tag.delete({ where: { id } });
  refresh();
  redirect("/admin/news/tags?deleted=1");
}
