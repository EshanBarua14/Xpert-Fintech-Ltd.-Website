import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { ArticleForm, type ArticleFormValues } from "@/components/admin/ArticleForm";
import { StatusBadge } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { TrashControls } from "@/components/admin/EditorParts";
import { imageOptions } from "@/lib/admin/media";
import { toLocalInput } from "@/lib/validation/common";
import { toDateInput } from "@/lib/validation/organizations";
import { deleteArticleForever, restoreArticle, trashArticle } from "../actions";

const emptyText = { title: "", slug: "", subtitle: "", excerpt: "", body: "" };

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; restored?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;
  const [images, cats] = await Promise.all([
    imageOptions(),
    db.articleCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
  ]);
  const categories = cats.map((c) => ({ value: c.id, label: c.translations.find((t) => t.locale === "en")?.name ?? c.key }));

  if (id === "new") {
    const values: ArticleFormValues = {
      status: "DRAFT", publishAt: "", sortOrder: 0, displayDate: "", authorName: "", coverMediaId: "", categoryId: "", tags: "",
      en: { ...emptyText }, bn: { ...emptyText },
    };
    return (
      <div className="flex flex-col gap-6">
        <Back />
        <h1 className="font-display text-3xl font-semibold">New article</h1>
        <ArticleForm values={values} images={images} categories={categories} />
      </div>
    );
  }

  if (!z.string().uuid().safeParse(id).success) notFound();
  const a = await db.article.findUnique({
    where: { id },
    include: { translations: true, tags: { include: { tag: { include: { translations: true } } } } },
  });
  if (!a) notFound();
  const text = (l: string) => {
    const t = a.translations.find((x) => x.locale === l);
    return t ? { title: t.title, slug: t.slug, subtitle: t.subtitle ?? "", excerpt: t.excerpt ?? "", body: t.body ?? "" } : { ...emptyText };
  };
  const tags = a.tags.map((at) => at.tag.translations.find((t) => t.locale === "en")?.name ?? at.tag.key).join(", ");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Back />
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {text("en").title || "Untitled article"}
          <StatusBadge status={a.status} publishAt={a.publishAt} deletedAt={a.deletedAt} />
        </h1>
        <p className="mt-1 text-xs text-text-secondary">Last edited {formatDhaka(a.updatedAt)}</p>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      {flags.restored && <Notice tone="success">Restored from the trash.</Notice>}
      {!a.deletedAt && (
        <ArticleForm
          images={images}
          categories={categories}
          values={{
            id: a.id,
            status: a.status,
            publishAt: toLocalInput(a.publishAt),
            sortOrder: a.sortOrder,
            displayDate: toDateInput(a.displayDate),
            authorName: a.authorName ?? "",
            coverMediaId: a.coverMediaId ?? "",
            categoryId: a.categoryId ?? "",
            tags,
            en: text("en"),
            bn: text("bn"),
          }}
        />
      )}
      <TrashControls id={a.id} inTrash={Boolean(a.deletedAt)} noun="article" onTrash={trashArticle} onRestore={restoreArticle} onDelete={deleteArticleForever} />
    </div>
  );
}

function Back() {
  return (
    <Link href="/admin/news" className="text-sm text-text-secondary hover:text-brand-sky">
      ← News
    </Link>
  );
}
