import Link from "next/link";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { Notice } from "@/components/admin/AdminList";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  await requireAdmin();
  const flags = await searchParams;
  const cats = await db.articleCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true, _count: { select: { articles: true } } },
  });
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/news" className="text-sm text-text-secondary hover:text-brand-sky">
        ← News
      </Link>
      <div>
        <h1 className="font-display text-3xl font-semibold">News categories</h1>
        <p className="mt-1 text-sm text-text-secondary">Shown as filters on the News page. Deleting a category keeps its articles, uncategorised.</p>
      </div>
      {flags.deleted && <Notice>Category deleted.</Notice>}
      <ul className="flex flex-col gap-3">
        {cats.map((c) => (
          <li key={c.id}>
            <CategoryForm
              values={{
                id: c.id,
                enName: c.translations.find((t) => t.locale === "en")?.name ?? c.key,
                bnName: c.translations.find((t) => t.locale === "bn")?.name ?? "",
                sortOrder: c.sortOrder,
              }}
              articleCount={c._count.articles}
            />
          </li>
        ))}
      </ul>
      <h2 className="font-display text-lg font-semibold">Add a category</h2>
      <CategoryForm values={{ enName: "", bnName: "", sortOrder: cats.length }} />
    </div>
  );
}
