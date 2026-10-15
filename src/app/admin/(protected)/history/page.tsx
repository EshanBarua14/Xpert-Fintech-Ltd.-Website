import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { describe } from "@/lib/admin/revisions";
import { restoreVersion } from "./actions";

const PAGE_SIZE = 40;
type Search = { id?: string; model?: string; page?: string; restored?: string; error?: string };

/**
 * Every change an admin made, with the version from just before it: put any of
 * them back with one click (like WordPress revisions and trash). Restoring keeps
 * the current version too, so a restore can be undone the same way.
 */
export default async function HistoryPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const where: Prisma.RevisionWhereInput = {
    ...(params.id && { entityId: params.id }),
    ...(params.model && { model: params.model }),
  };
  const [rows, total, admins, models] = await Promise.all([
    db.revision.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: { id: true, model: true, entityId: true, action: true, label: true, actorId: true, createdAt: true, undoneAt: true } }),
    db.revision.count({ where }),
    db.adminUser.findMany({ select: { id: true, name: true } }),
    db.revision.findMany({ distinct: ["model"], select: { model: true } }),
  ]);
  const who = new Map<string, string>(admins.map((a): [string, string] => [a.id, a.name]));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: Partial<Search>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ id: params.id, model: params.model, page: params.page, ...p })) if (v) q.set(k, String(v));
    return `/admin/history${q.size ? `?${q}` : ""}`;
  };
  const back = qs({});
  const first = rows[0];
  const item = params.id && first ? describe(first.model, first.entityId) : null;

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">History{params.id && first?.label ? `: ${first.label}` : ""}</h1>
        <p className="mt-1 max-w-3xl text-sm text-text-secondary">
          Each line is the version of an item from just before someone changed or deleted it. Choose <strong>Restore this version</strong> to put it back
          exactly as it was, including its Bangla text. Nothing is lost: the version it replaces is kept here too, so a restore can be undone the same way.
          Items moved to the trash are brought back from their own list (View trash → Restore). For your latest change, use <strong>Undo</strong> and{" "}
          <strong>Redo</strong> at the top of every admin page (or Ctrl+Z and Ctrl+Shift+Z).
        </p>
        {item?.edit && (
          <Link href={item.edit} className="mt-2 inline-block text-sm font-semibold text-brand-sky hover:underline">
            Open this {item.section.toLowerCase()} →
          </Link>
        )}
      </div>
      {params.restored && <Notice tone="success">Restored. The website shows this version now.</Notice>}
      {params.error && <Notice>{params.error}</Notice>}

      <form className="flex flex-wrap items-end gap-3 text-sm" action="/admin/history">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary">Area</span>
          <select name="model" defaultValue={params.model ?? ""} className="field-select h-10 rounded-control border border-fg/15 bg-ink-950/60 px-3">
            <option value="">Everything</option>
            {models
              .map((m) => ({ m: m.model, name: describe(m.model, "").section }))
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(({ m, name }) => (
                <option key={m} value={m}>
                  {name}
                </option>
              ))}
          </select>
        </label>
        {params.id && <input type="hidden" name="id" value={params.id} />}
        <button type="submit" className="h-10 rounded-control border border-fg/15 px-4 hover:border-brand-sky">
          Show
        </button>
        {(params.id || params.model) && (
          <Link href="/admin/history" className="h-10 content-center px-2 text-brand-sky hover:underline">
            Show everything
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <p className="rounded-card border border-dashed border-fg/15 p-8 text-center text-text-secondary">
          No changes recorded yet. From now on, every time an admin saves or deletes something, the version from just before is kept here.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-fg/10 rounded-card border border-fg/10">
          {rows.map((r) => {
            const d = describe(r.model, r.entityId);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
                <span className="w-40 shrink-0 text-text-secondary">{formatDhaka(r.createdAt)}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium text-text-primary">
                    {d.section}
                    {r.label ? `: ${r.label}` : r.model === "SiteSetting" ? `: ${r.entityId}` : ""}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {r.undoneAt ? "(undone) " : ""}
                    {r.action === "create" ? "Added" : r.action === "delete" ? "Before it was deleted" : r.action === "restore" ? "Before an undo" : "Before it was changed"} by{" "}
                    {who.get(r.actorId ?? "") ?? "an admin"}
                    {" · "}
                    <Link href={qs({ id: r.entityId, model: undefined, page: undefined })} className="text-brand-sky hover:underline">
                      all versions
                    </Link>
                    {d.edit && (
                      <>
                        {" · "}
                        <Link href={d.edit} className="text-brand-sky hover:underline">
                          open
                        </Link>
                      </>
                    )}
                  </span>
                </span>
                <form action={restoreVersion}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="back" value={back} />
                  <button type="submit" className="h-9 rounded-control border border-brand-sky/50 px-3 text-sm font-semibold text-brand-sky hover:bg-brand-sky/10">
                    {r.action === "create" ? "Remove it again" : r.action === "delete" ? "Bring back" : "Restore this version"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center gap-3 text-sm">
          {page > 1 && <Link href={qs({ page: String(page - 1) })} className="text-brand-sky hover:underline">← Newer</Link>}
          <span className="text-text-secondary">
            Page {page} of {pages}
          </span>
          {page < pages && <Link href={qs({ page: String(page + 1) })} className="text-brand-sky hover:underline">Older →</Link>}
        </nav>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
