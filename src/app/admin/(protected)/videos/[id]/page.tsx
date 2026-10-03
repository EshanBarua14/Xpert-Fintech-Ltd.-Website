import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { VideoForm, type VideoFormValues } from "@/components/admin/VideoForm";
import { StatusBadge } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { TrashControls } from "@/components/admin/EditorParts";
import { imageOptions, videoFileOptions } from "@/lib/admin/media";
import { toLocalInput } from "@/lib/validation/common";
import { toDateInput } from "@/lib/validation/organizations";
import { deleteVideoForever, restoreVideo, trashVideo } from "../actions";

const emptyText = { title: "", description: "" };

/** 3750 → "1:02:30", 225 → "3:45". */
function formatDuration(sec: number | null): string {
  if (sec == null) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

async function eventOptions() {
  const rows = await db.event.findMany({
    where: { deletedAt: null },
    orderBy: [{ startsAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    include: { translations: { where: { locale: "en" } } },
    take: 300,
  });
  return rows.map((e) => ({ value: e.id, label: e.translations[0]?.title ?? "(untitled event)" }));
}

export default async function VideoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; restored?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;
  const [images, files, events] = await Promise.all([imageOptions(), videoFileOptions(), eventOptions()]);
  const back = (
    <Link href="/admin/videos" className="text-sm text-text-secondary hover:text-brand-sky">
      ← Videos
    </Link>
  );
  if (id === "new") {
    const values: VideoFormValues = {
      status: "DRAFT",
      publishAt: "",
      sortOrder: 0,
      source: "LINK",
      url: "",
      mediaId: "",
      posterMediaId: "",
      eventId: "",
      recordedAt: "",
      duration: "",
      isFeatured: false,
      en: { ...emptyText },
      bn: { ...emptyText },
    };
    return (
      <div className="flex flex-col gap-6">
        {back}
        <h1 className="font-display text-3xl font-semibold">New video</h1>
        <VideoForm values={values} images={images} files={files} events={events} />
      </div>
    );
  }
  if (!z.string().uuid().safeParse(id).success) notFound();
  const video = await db.video.findUnique({ where: { id }, include: { translations: true } });
  if (!video) notFound();
  const text = (l: string) => {
    const t = video.translations.find((x) => x.locale === l);
    return t ? { title: t.title, description: t.description ?? "" } : { ...emptyText };
  };
  return (
    <div className="flex flex-col gap-8">
      <div>
        {back}
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {text("en").title || "Untitled video"}
          <StatusBadge status={video.status} publishAt={video.publishAt} deletedAt={video.deletedAt} />
        </h1>
        <p className="mt-1 text-xs text-text-secondary">
          Last edited {formatDhaka(video.updatedAt)}
          {video.status === "PUBLISHED" && !video.deletedAt && (
            <>
              {" · "}
              <a href={`/en/gallery#video-${video.id}`} target="_blank" rel="noopener noreferrer" className="text-brand-sky hover:underline">
                View on website ↗
              </a>
            </>
          )}
        </p>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      {flags.restored && <Notice tone="success">Restored from the trash.</Notice>}
      {!video.deletedAt && (
        <VideoForm
          images={images}
          files={files}
          events={events}
          values={{
            id: video.id,
            status: video.status,
            publishAt: toLocalInput(video.publishAt),
            sortOrder: video.sortOrder,
            source: video.provider === "UPLOAD" ? "FILE" : "LINK",
            url: video.url ?? "",
            mediaId: video.mediaId ?? "",
            posterMediaId: video.posterMediaId ?? "",
            eventId: video.eventId ?? "",
            recordedAt: toDateInput(video.recordedAt),
            duration: formatDuration(video.durationSec),
            isFeatured: video.isFeatured,
            en: text("en"),
            bn: text("bn"),
          }}
        />
      )}
      <TrashControls id={video.id} inTrash={Boolean(video.deletedAt)} noun="video" onTrash={trashVideo} onRestore={restoreVideo} onDelete={deleteVideoForever} />
    </div>
  );
}
