import { db } from "@/lib/db/client";
import { requireFullAdmin } from "@/lib/auth/session";
import { ConfirmButton } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { buttonClasses } from "@/components/ui/Button";
import { formatBytes } from "@/lib/media/format";
import { backupNow, deleteBackup, restoreFromBackup, restoreFromFile } from "./actions";

const KIND: Record<string, string> = { auto: "Automatic (daily)", manual: "Made by an admin", "before-restore": "Made before a restore" };

type Search = { made?: string; restored?: string; deleted?: string; error?: string };

/**
 * Backups of the whole site's content: one is made automatically every day,
 * one on demand, and one before every restore. Download one to keep a copy
 * outside the site; restore one to put all content back as it was then.
 */
export default async function BackupsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireFullAdmin();
  const params = await searchParams;
  const [rows, admins] = await Promise.all([
    db.backup.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, kind: true, sizeBytes: true, counts: true, actorId: true, note: true, createdAt: true } }),
    db.adminUser.findMany({ select: { id: true, name: true } }),
  ]);
  const who = new Map(admins.map((a) => [a.id, a.name]));
  const total = (c: unknown) => Object.values((c ?? {}) as Record<string, number>).reduce((a, b) => a + b, 0);

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Backups</h1>
        <p className="mt-1 max-w-3xl text-sm text-text-secondary">
          A backup is a full copy of the website&apos;s content: pages and blocks, products, people, news, events, organizations, menus, settings, site
          text, media details and everything else you edit here, in English and Bangla. One is made <strong>automatically every day</strong>, and you can
          make one any time. Restoring puts all content back as it was in that backup; a backup of the current content is made first, so a restore can be
          undone too. Admin accounts, sign-ins, the change history and the uploaded files themselves are not part of a backup and are never changed by a restore.
          For single changes, use <strong>Undo</strong> at the top or History.
        </p>
      </div>
      {params.made && <Notice tone="success">Backup made.</Notice>}
      {params.restored && <Notice tone="success">Restored. The website shows the content from that backup now. To go back, restore the backup marked “Made before a restore”.</Notice>}
      {params.deleted && <Notice tone="success">Backup deleted.</Notice>}
      {params.error && <Notice>{params.error}</Notice>}

      <section className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
        <form action={backupNow} className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-64 flex-1 flex-col gap-1 text-sm">
            <span className="text-xs text-text-secondary">Note (optional)</span>
            <input name="note" maxLength={200} placeholder="e.g. Before the October redesign" className="h-10 rounded-control border border-fg/15 bg-ink-950/60 px-3" />
          </label>
          <button type="submit" className={buttonClasses({ variant: "primary" })}>
            Back up now
          </button>
        </form>
        <form action={restoreFromFile} className="flex flex-wrap items-end gap-3 border-t border-fg/10 pt-4">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-xs text-text-secondary">Restore from a downloaded backup file (.json.gz)</span>
            <input type="file" name="file" accept=".gz,application/gzip" className="text-sm" />
          </label>
          <ConfirmButton message="Replace ALL website content with the content in this file? A backup of the current content is made first.">Restore from file</ConfirmButton>
        </form>
      </section>

      {rows.length === 0 ? (
        <p className="rounded-card border border-dashed border-fg/15 p-8 text-center text-text-secondary">
          No backups yet. The first automatic one is made within a day; or choose Back up now.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-fg/10 rounded-card border border-fg/10">
          {rows.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium text-text-primary">{formatDhaka(b.createdAt)}</span>
                <span className="text-xs text-text-secondary">
                  {KIND[b.kind] ?? b.kind}
                  {b.actorId && who.get(b.actorId) ? ` by ${who.get(b.actorId)}` : ""} · {total(b.counts).toLocaleString("en-US")} records · {formatBytes(b.sizeBytes)}
                  {b.note ? ` · ${b.note}` : ""}
                </span>
              </span>
              <a href={`/admin/backups/${b.id}/download`} className="h-9 content-center rounded-control border border-fg/15 px-3 font-semibold hover:border-brand-sky">
                Download
              </a>
              <form action={restoreFromBackup}>
                <input type="hidden" name="id" value={b.id} />
                <ConfirmButton
                  message={`Replace ALL website content with this backup from ${formatDhaka(b.createdAt)}? A backup of the current content is made first, so you can go back.`}
                  className="h-9 rounded-control border border-brand-sky/50 px-3 font-semibold text-brand-sky hover:bg-brand-sky/10"
                >
                  Restore
                </ConfirmButton>
              </form>
              <form action={deleteBackup}>
                <input type="hidden" name="id" value={b.id} />
                <ConfirmButton message="Delete this backup for good?" className="h-9 rounded-control px-3 text-market-down hover:bg-market-down/10">
                  Delete
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
