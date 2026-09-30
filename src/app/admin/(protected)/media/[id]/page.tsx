import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { MediaDetailsForm } from "@/components/admin/MediaDetailsForm";
import { ConfirmButton } from "@/components/admin/AdminUi";
import { buttonClasses } from "@/components/ui/Button";
import { formatBytes } from "@/lib/media/format";
import { deleteMediaForever, restoreMedia, trashMedia } from "../actions";

export default async function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const media = await db.media.findUnique({ where: { id }, include: { translations: true, usages: true } });
  if (!media) notFound();

  const t = (locale: "en" | "bn") => media.translations.find((x) => x.locale === locale);
  const url = `/media/${media.storageKey}`;
  const isImage = media.kind === "IMAGE";
  const inTrash = Boolean(media.deletedAt);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/media" className="text-sm text-text-secondary hover:text-brand-sky">
          ← Media
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold break-all">{media.originalName}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex items-center justify-center rounded-card border border-white/10 bg-ink-950 p-4">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of our own served file
            <img src={url} alt={t("en")?.altText ?? ""} className="max-h-[70vh] w-auto object-contain" />
          ) : (
            <a href={url} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "secondary" })}>
              Open PDF ↗
            </a>
          )}
        </div>

        <dl className="grid grid-cols-[auto_1fr] content-start gap-x-4 gap-y-2 text-sm">
          <dt className="text-text-secondary">Type</dt>
          <dd>{media.mimeType}</dd>
          <dt className="text-text-secondary">Size</dt>
          <dd>{formatBytes(media.sizeBytes)}</dd>
          {media.width && media.height && (
            <>
              <dt className="text-text-secondary">Dimensions</dt>
              <dd>
                {media.width} × {media.height} px
              </dd>
            </>
          )}
          <dt className="text-text-secondary">Uploaded</dt>
          <dd>{media.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" })}</dd>
          <dt className="text-text-secondary">Address</dt>
          <dd className="tabular text-xs break-all">{url}</dd>
          <dt className="text-text-secondary">Used in</dt>
          <dd>{media.usages.length === 0 ? "Not used yet" : `${media.usages.length} place${media.usages.length === 1 ? "" : "s"}`}</dd>
        </dl>
      </div>

      {inTrash ? (
        <section className="flex flex-col gap-4 rounded-card border border-market-down/30 p-6">
          <p>This file is in the trash and no longer shown on the website.</p>
          <div className="flex flex-wrap gap-3">
            <form action={restoreMedia}>
              <input type="hidden" name="id" value={media.id} />
              <button type="submit" className={buttonClasses({})}>
                Restore
              </button>
            </form>
            {media.usages.length === 0 ? (
              <form action={deleteMediaForever}>
                <input type="hidden" name="id" value={media.id} />
                <ConfirmButton message="Delete this file permanently? This cannot be undone.">Delete permanently</ConfirmButton>
              </form>
            ) : (
              <p className="text-sm text-text-secondary">It is still used, so it cannot be deleted permanently.</p>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-semibold">Details</h2>
            <MediaDetailsForm
              isImage={isImage}
              values={{
                id: media.id,
                enAlt: t("en")?.altText ?? "",
                bnAlt: t("bn")?.altText ?? "",
                enCaption: t("en")?.caption ?? "",
                bnCaption: t("bn")?.caption ?? "",
                tags: media.tags.join(", "),
              }}
            />
          </section>
          <section className="flex items-center justify-between gap-4 border-t border-white/10 pt-6">
            <p className="text-sm text-text-secondary">
              {media.usages.length > 0
                ? "This file is in use. Moving it to the trash removes it from those places on the website."
                : "Move to trash to hide it. You can restore it from the trash."}
            </p>
            <form action={trashMedia}>
              <input type="hidden" name="id" value={media.id} />
              <ConfirmButton message="Move this file to the trash?">Move to trash</ConfirmButton>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
