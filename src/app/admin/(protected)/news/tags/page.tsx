import Link from "next/link";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { Notice } from "@/components/admin/AdminList";
import { TagForm } from "@/components/admin/TagForm";

export default async function TagsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  await requireAdmin();
  const flags = await searchParams;
  const tags = await db.tag.findMany({
    orderBy: { key: "asc" },
    include: { translations: true, _count: { select: { articles: true } } },
  });
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/news" className="text-sm text-text-secondary hover:text-brand-sky">
        ← News
      </Link>
      <div>
        <h1 className="font-display text-3xl font-semibold">News tags</h1>
        <p className="mt-1 text-sm text-text-secondary">Shown on each article. Tags are also created when you type them on an article. Renaming a tag renames it on every article.</p>
      </div>
      {flags.deleted && <Notice>Tag deleted.</Notice>}
      {tags.length === 0 && <p className="text-sm text-text-secondary">No tags yet.</p>}
      <ul className="flex flex-col gap-3">
        {tags.map((t) => (
          <li key={t.id}>
            <TagForm
              values={{
                id: t.id,
                enName: t.translations.find((x) => x.locale === "en")?.name ?? t.key,
                bnName: t.translations.find((x) => x.locale === "bn")?.name ?? "",
              }}
              articleCount={t._count.articles}
            />
          </li>
        ))}
      </ul>
      <h2 className="font-display text-lg font-semibold">Add a tag</h2>
      <TagForm values={{ enName: "", bnName: "" }} />
    </div>
  );
}
