import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { formatBytes } from "@/lib/media/format";

type Search = { q?: string; kind?: string; view?: string; trashed?: string; deleted?: string };

export default async function MediaPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim().toLowerCase() ?? "";
  const kind = params.kind === "IMAGE" || params.kind === "DOCUMENT" ? params.kind : undefined;

  const where: Prisma.MediaWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    // Job applicants' CVs are managed in Applications, not here.
    NOT: { tags: { has: "private" } },
    ...(kind && { kind }),
    ...(q && { OR: [{ originalName: { contains: q, mode: "insensitive" } }, { tags: { has: q } }] }),
  };
  const [items, trashCount] = await Promise.all([
    db.media.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    db.media.count({ where: { deletedAt: { not: null } } }),
  ]);

  const filterHref = (k?: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (k) p.set("kind", k);
    return `/admin/media${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">{inTrash ? "Media — trash" : "Media"}</h1>
        <p className="mt-1 text-sm text-text-secondary">Images and documents used on the website.</p>
      </div>

      {params.trashed && <p role="status" className="text-sm text-brand-sky">Moved to trash.</p>}
      {params.deleted && <p role="status" className="text-sm text-brand-sky">Deleted permanently.</p>}

      {!inTrash && <MediaUpload />}

      <div className="flex flex-wrap items-center gap-3">
        {!inTrash && (
          <>
            <form className="flex gap-2" role="search">
              {kind && <input type="hidden" name="kind" value={kind} />}
              <label htmlFor="q" className="sr-only">
                Search media
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Search by name or tag"
                className="h-9 w-56 rounded-control border border-fg/15 bg-ink-950/60 px-3 text-sm focus:border-brand-sky focus:outline-none"
              />
              <button type="submit" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                Search
              </button>
            </form>
            <div className="flex gap-1 text-sm">
              {(
                [
                  [undefined, "All"],
                  ["IMAGE", "Images"],
                  ["DOCUMENT", "Documents"],
                ] as const
              ).map(([k, label]) => (
                <Link
                  key={label}
                  href={filterHref(k)}
                  aria-current={kind === k ? "page" : undefined}
                  className={cn("rounded-control px-3 py-1.5", kind === k ? "bg-fg/10" : "text-text-secondary hover:text-text-primary")}
                >
                  {label}
                </Link>
              ))}
            </div>
          </>
        )}
        <Link href={inTrash ? "/admin/media" : "/admin/media?view=trash"} className="ml-auto text-sm text-text-secondary hover:text-brand-sky">
          {inTrash ? "← Back to media" : `Trash (${trashCount})`}
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-card border border-fg/10 px-4 py-10 text-center text-text-secondary">
          {inTrash ? "The trash is empty." : "No files yet."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {items.map((m) => (
            <li key={m.id}>
              <Link
                href={`/admin/media/${m.id}`}
                className="flex h-full flex-col overflow-hidden rounded-card border border-fg/10 hover:border-brand-sky/50"
              >
                <span className="flex aspect-[4/3] items-center justify-center bg-ink-950">
                  {m.kind === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails, served from our own route
                    <img src={`/media/${m.storageKey}`} alt="" loading="lazy" className="h-full w-full object-contain" />
                  ) : (
                    <span className="tabular text-sm text-text-secondary">PDF</span>
                  )}
                </span>
                <span className="flex flex-col gap-0.5 p-3">
                  <span className="truncate text-sm" title={m.originalName}>
                    {m.originalName}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {formatBytes(m.sizeBytes)}
                    {m.width && m.height ? ` · ${m.width}×${m.height}` : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
