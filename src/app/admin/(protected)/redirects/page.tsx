import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { RedirectForm } from "@/components/admin/RedirectForm";

export default async function RedirectsPage() {
  await requireAdmin();
  const rows = await db.redirect.findMany({ orderBy: [{ isActive: "desc" }, { fromPath: "asc" }] });
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Redirects</h1>
        <p className="mt-1 max-w-3xl text-sm text-text-secondary">
          Send visitors and search engines from an old address (for example a page of the previous website) to its new home. Enter the old address without
          /en or /bn. A redirect is used only when no page exists at that address. Use Permanent unless the move is temporary.
        </p>
      </div>
      <h2 className="font-display text-lg font-semibold">Add a redirect</h2>
      <RedirectForm values={{ fromPath: "", toPath: "", statusCode: 301, isActive: true, note: "" }} />
      <h2 className="font-display text-lg font-semibold">Redirects ({rows.length})</h2>
      {rows.length === 0 && <p className="text-sm text-text-secondary">None yet.</p>}
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.id}>
            <RedirectForm values={{ id: r.id, fromPath: r.fromPath, toPath: r.toPath, statusCode: r.statusCode, isActive: r.isActive, note: r.note ?? "" }} hits={r.hits} />
          </li>
        ))}
      </ul>
    </div>
  );
}
