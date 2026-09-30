import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export function Notice({ tone = "info", children }: { tone?: "info" | "success"; children: ReactNode }) {
  return (
    <p
      role="status"
      className={cn(
        "rounded-control border px-4 py-2 text-sm",
        tone === "success" ? "border-market-up/30 bg-market-up/10" : "border-brand-sky/30 bg-brand-sky/10",
      )}
    >
      {children}
    </p>
  );
}

export type ListRow = {
  id: string;
  href: string;
  title: string;
  subtitle?: string | null;
  cells: ReactNode[];
};

/**
 * Standard admin list: heading, "New" button, search, filter tabs, trash link
 * and a table. Each section passes its own columns and rows.
 */
export function AdminList({
  title,
  intro,
  basePath,
  newLabel,
  inTrash,
  trashCount,
  q,
  filters,
  columns,
  rows,
  notices,
}: {
  title: string;
  intro: string;
  basePath: string;
  newLabel?: string;
  inTrash: boolean;
  trashCount: number;
  q: string;
  filters?: { label: string; value?: string; param: string; active: boolean }[];
  columns: string[];
  rows: ListRow[];
  notices?: ReactNode;
}) {
  const activeFilter = filters?.find((f) => f.active && f.value);
  const hrefFor = (param?: string, value?: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (param && value) p.set(param, value);
    return `${basePath}${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{inTrash ? `${title} — trash` : title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{inTrash ? "Restore an item, or delete it permanently." : intro}</p>
        </div>
        {!inTrash && newLabel && (
          <Link href={`${basePath}/new`} className={buttonClasses({})}>
            {newLabel}
          </Link>
        )}
      </div>

      {notices}

      <div className="flex flex-wrap items-center gap-3">
        {!inTrash && (
          <>
            <form className="flex gap-2" role="search">
              {activeFilter && <input type="hidden" name={activeFilter.param} value={activeFilter.value} />}
              <label htmlFor="q" className="sr-only">
                Search
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
            {filters && (
              <div className="flex flex-wrap gap-1 text-sm">
                {filters.map((f) => (
                  <Link
                    key={f.label}
                    href={hrefFor(f.param, f.value)}
                    aria-current={f.active ? "page" : undefined}
                    className={cn("rounded-control px-3 py-1.5", f.active ? "bg-white/10" : "text-text-secondary hover:text-text-primary")}
                  >
                    {f.label}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
        <Link href={inTrash ? basePath : `${basePath}?view=trash`} className="ml-auto text-sm text-text-secondary hover:text-brand-sky">
          {inTrash ? "← Back" : `Trash (${trashCount})`}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-card border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs tracking-wide text-text-secondary uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Name
              </th>
              {columns.map((c) => (
                <th key={c} scope="col" className="px-4 py-3 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-text-secondary">
                  {inTrash ? "The trash is empty." : "Nothing here yet."}
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <Link href={r.href} className="font-medium hover:text-brand-sky">
                    {r.title}
                  </Link>
                  {r.subtitle && <span className="block text-xs text-text-secondary">{r.subtitle}</span>}
                </td>
                {r.cells.map((cell, i) => (
                  <td key={i} className="px-4 py-3 text-text-secondary">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function formatDhaka(date: Date | null | undefined, withTime = true) {
  if (!date) return "—";
  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  });
}
