import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";

type Search = { q?: string; view?: string; trashed?: string; deleted?: string; category?: string };

export default async function NewsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";
  const categories = await db.articleCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } });
  const category = categories.find((c) => c.id === params.category);

  const where: Prisma.ArticleWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(category && { categoryId: category.id }),
    ...(q && { translations: { some: { title: { contains: q, mode: "insensitive" } } } }),
  };
  const [articles, trashCount] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: [{ displayDate: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
      include: { translations: true, category: { include: { translations: true } }, _count: { select: { tags: true } } },
    }),
    db.article.count({ where: { deletedAt: { not: null } } }),
  ]);
  const catName = (c: (typeof categories)[number]) => c.translations.find((t) => t.locale === "en")?.name ?? c.key;

  return (
    <div className="flex flex-col gap-4">
      <AdminList
        title="News"
        intro="Articles, announcements and company news shown on the News page."
        basePath="/admin/news"
        newLabel="New article"
        inTrash={inTrash}
        trashCount={trashCount}
        q={q}
        filters={[
          { label: "All", param: "category", active: !category },
          ...categories.map((c) => ({ label: catName(c), value: c.id, param: "category", active: category?.id === c.id })),
        ]}
        columns={["Date", "Category", "Status", "Updated"]}
        notices={
          <>
            {params.trashed && <Notice>Moved to trash.</Notice>}
            {params.deleted && <Notice>Deleted permanently.</Notice>}
          </>
        }
        rows={articles.map((a) => ({
          id: a.id,
          href: `/admin/news/${a.id}`,
          title: a.translations.find((t) => t.locale === "en")?.title ?? "(no English title)",
          subtitle: a.translations.some((t) => t.locale === "bn") ? null : "No Bangla version yet",
          cells: [
            a.displayDate ? formatDhaka(a.displayDate, false) : "Publish date",
            a.category ? (a.category.translations.find((t) => t.locale === "en")?.name ?? a.category.key) : "—",
            <StatusBadge key="s" status={a.status} publishAt={a.publishAt} deletedAt={a.deletedAt} />,
            formatDhaka(a.updatedAt),
          ],
        }))}
      />
      <div className="flex flex-wrap gap-6">
        <Link href="/admin/news/categories" className="text-sm text-brand-sky hover:underline">
          Manage categories →
        </Link>
        <Link href="/admin/news/tags" className="text-sm text-brand-sky hover:underline">
          Manage tags →
        </Link>
      </div>
    </div>
  );
}
