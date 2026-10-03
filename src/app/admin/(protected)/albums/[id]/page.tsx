import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { AlbumForm, type AlbumFormValues } from "@/components/admin/AlbumForm";
import { StatusBadge } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { TrashControls } from "@/components/admin/EditorParts";
import { imageOptions } from "@/lib/admin/media";
import { toLocalInput } from "@/lib/validation/common";
import { toDateInput } from "@/lib/validation/organizations";
import { deleteAlbumForever, restoreAlbum, trashAlbum } from "../actions";

const emptyText = { title: "", slug: "", description: "" };

export default async function AlbumPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; restored?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;
  const images = await imageOptions();
  const back = (
    <Link href="/admin/albums" className="text-sm text-text-secondary hover:text-brand-sky">
      ← Photo albums
    </Link>
  );
  if (id === "new") {
    const values: AlbumFormValues = { status: "DRAFT", publishAt: "", sortOrder: 0, takenAt: "", coverMediaId: "", photos: [], en: { ...emptyText }, bn: { ...emptyText } };
    return (
      <div className="flex flex-col gap-6">
        {back}
        <h1 className="font-display text-3xl font-semibold">New album</h1>
        <AlbumForm values={values} images={images} />
      </div>
    );
  }
  if (!z.string().uuid().safeParse(id).success) notFound();
  const album = await db.album.findUnique({ where: { id }, include: { translations: true, photos: { orderBy: { sortOrder: "asc" } } } });
  if (!album) notFound();
  const text = (l: string) => {
    const t = album.translations.find((x) => x.locale === l);
    return t ? { title: t.title, slug: t.slug, description: t.description ?? "" } : { ...emptyText };
  };
  const en = album.translations.find((x) => x.locale === "en");
  return (
    <div className="flex flex-col gap-8">
      <div>
        {back}
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {text("en").title || "Untitled album"}
          <StatusBadge status={album.status} publishAt={album.publishAt} deletedAt={album.deletedAt} />
        </h1>
        <p className="mt-1 text-xs text-text-secondary">
          Last edited {formatDhaka(album.updatedAt)}
          {en && album.status === "PUBLISHED" && !album.deletedAt && (
            <>
              {" · "}
              <a href={`/en/gallery/${en.slug}`} target="_blank" rel="noopener noreferrer" className="text-brand-sky hover:underline">
                View on website ↗
              </a>
            </>
          )}
        </p>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      {flags.restored && <Notice tone="success">Restored from the trash.</Notice>}
      {!album.deletedAt && (
        <AlbumForm
          images={images}
          values={{
            id: album.id,
            status: album.status,
            publishAt: toLocalInput(album.publishAt),
            sortOrder: album.sortOrder,
            takenAt: toDateInput(album.takenAt),
            coverMediaId: album.coverMediaId ?? "",
            photos: album.photos.map((p) => p.mediaId),
            en: text("en"),
            bn: text("bn"),
          }}
        />
      )}
      <TrashControls id={album.id} inTrash={Boolean(album.deletedAt)} noun="album" onTrash={trashAlbum} onRestore={restoreAlbum} onDelete={deleteAlbumForever} />
    </div>
  );
}
