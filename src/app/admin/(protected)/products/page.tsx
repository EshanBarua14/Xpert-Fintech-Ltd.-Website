import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type Search = { q?: string; status?: string; view?: string; trashed?: string; deleted?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";
  const status = params.status === "DRAFT" || params.status === "PUBLISHED" ? params.status : undefined;

  const where: Prisma.OfferingWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(status && { status }),
    ...(q && { translations: { some: { name: { contains: q, mode: "insensitive" } } } }),
  };

  const [offerings, trashCount] = await Promise.all([
    db.offering.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { translations: true, parent: { include: { translations: { where: { locale: "en" } } } } },
    }),
    db.offering.count({ where: { deletedAt: { not: null } } }),
  ]);

  const filterLink = (s?: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (s) p.set("status", s);
    return `/admin/products${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{inTrash ? "Products — trash" : "Products"}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {inTrash
              ? "Restore a product, or delete it permanently."
              : "Products, platform, modules, services and integrations shown on the website."}
          </p>
        </div>
        {!inTrash && (
          <Link href="/admin/products/new" className={buttonClasses({})}>
            New product
          </Link>
        )}
      </div>

      {params.trashed && <Notice>Moved to trash. You can restore it from the trash.</Notice>}
      {params.deleted && <Notice>Deleted permanently.</Notice>}

      <div className="flex flex-wrap items-center gap-3">
        {!inTrash && (
          <>
            <form className="flex gap-2" role="search">
              {status && <input type="hidden" name="status" value={status} />}
              <label htmlFor="q" className="sr-only">
                Search products
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Search by name"
                className="h-9 w-56 rounded-control border border-white/15 bg-ink-950/60 px-3 text-sm focus:border-brand-sky focus:outline-none"
              />
              <button type="submit" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                Search
              </button>
            </form>
            <div className="flex gap-1 text-sm">
              {(
                [
                  [undefined, "All"],
                  ["PUBLISHED", "Published"],
                  ["DRAFT", "Draft"],
                ] as const
              ).map(([s, label]) => (
                <Link
                  key={label}
                  href={filterLink(s)}
                  aria-current={status === s ? "page" : undefined}
                  className={cn(
                    "rounded-control px-3 py-1.5",
                    status === s ? "bg-white/10" : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </>
        )}
        <Link
          href={inTrash ? "/admin/products" : "/admin/products?view=trash"}
          className="ml-auto text-sm text-text-secondary hover:text-brand-sky"
        >
          {inTrash ? "← Back to products" : `Trash (${trashCount})`}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-card border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs tracking-wide text-text-secondary uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Name</th>
              <th scope="col" className="px-4 py-3 font-medium">Type</th>
              <th scope="col" className="px-4 py-3 font-medium">Languages</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {offerings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-text-secondary">
                  {inTrash ? "The trash is empty." : "No products match."}
                </td>
              </tr>
            )}
            {offerings.map((o) => {
              const en = o.translations.find((t) => t.locale === "en");
              const hasBn = o.translations.some((t) => t.locale === "bn");
              const parentName = o.parent?.translations[0]?.name;
              return (
                <tr key={o.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${o.id}`} className="font-medium hover:text-brand-sky">
                      {en?.name ?? "(no English name)"}
                    </Link>
                    {parentName && <span className="block text-xs text-text-secondary">in {parentName}</span>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary capitalize">{o.type.toLowerCase()}</td>
                  <td className="px-4 py-3 text-text-secondary">{hasBn ? "EN · বাংলা" : "EN only"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} publishAt={o.publishAt} deletedAt={o.deletedAt} />
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {o.updatedAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="rounded-control border border-brand-sky/30 bg-brand-sky/10 px-4 py-2 text-sm">
      {children}
    </p>
  );
}
