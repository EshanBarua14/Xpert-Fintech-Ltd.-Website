import Link from "next/link";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";

const DESCRIPTIONS: Record<string, string> = {
  header: "Main menu at the top of every page. Items with sub-links become dropdowns.",
  footer: "Footer columns. Top-level items are column headings; the links under them are listed in the column.",
  "footer-legal": "Small links at the very bottom: privacy, terms, accessibility.",
};

export default async function NavigationPage() {
  await requireAdmin();
  const menus = await db.navMenu.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Navigation</h1>
        <p className="mt-1 text-sm text-text-secondary">Menus in the header and footer. Changes appear on the website right away.</p>
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {menus.map((m) => (
          <li key={m.id}>
            <Link
              href={`/admin/navigation/${m.key}`}
              className="flex h-full flex-col gap-2 rounded-card border border-white/10 bg-ink-950/50 p-5 hover:border-brand-sky/40"
            >
              <span className="font-semibold">{m.name}</span>
              <span className="text-sm text-text-secondary">{DESCRIPTIONS[m.key] ?? `Menu key: ${m.key}`}</span>
              <span className="tabular mt-auto text-xs text-text-secondary">{m._count.items} items</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
