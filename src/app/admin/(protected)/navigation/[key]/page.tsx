import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { NavigationEditor, type EditorNavItem } from "@/components/admin/NavigationEditor";

export default async function MenuPage({ params }: { params: Promise<{ key: string }> }) {
  await requireAdmin();
  const { key } = await params;
  const menu = await db.navMenu.findUnique({
    where: { key },
    include: { items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { translations: true } } },
  });
  if (!menu) notFound();

  const toEditor = (item: (typeof menu.items)[number]): EditorNavItem => {
    const en = item.translations.find((t) => t.locale === "en");
    const bn = item.translations.find((t) => t.locale === "bn");
    return {
      id: item.id,
      parentId: item.parentId,
      linkType: item.linkType,
      href: item.href ?? "",
      openInNewTab: item.openInNewTab,
      isCta: item.isCta,
      isHidden: item.isHidden,
      en: { label: en?.label ?? "", description: en?.description ?? "" },
      bn: { label: bn?.label ?? "", description: bn?.description ?? "" },
      children: [],
    };
  };

  const top = menu.items.filter((i) => !i.parentId).map(toEditor);
  for (const parent of top) {
    parent.children = menu.items.filter((i) => i.parentId === parent.id).map(toEditor);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/navigation" className="text-sm text-text-secondary hover:text-brand-sky">
          ← Navigation
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold">{menu.name}</h1>
      </div>
      <NavigationEditor menuId={menu.id} items={top} />
    </div>
  );
}
