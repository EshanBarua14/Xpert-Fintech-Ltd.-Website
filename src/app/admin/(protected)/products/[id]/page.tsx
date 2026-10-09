import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { ProductForm } from "@/components/admin/ProductForm";
import { OfferingItemsEditor, type EditorItem } from "@/components/admin/OfferingItemsEditor";
import { ProductMediaForm } from "@/components/admin/ProductMediaForm";
import { ScreenDetailsForm } from "@/components/admin/ScreenDetailsForm";
import { imageOptions, videoFileOptions } from "@/lib/admin/media";
import { ConfirmButton, StatusBadge } from "@/components/admin/AdminUi";
import { buttonClasses } from "@/components/ui/Button";
import { parentOptions, toProductFormValues } from "@/lib/admin/products";
import { deleteOfferingForever, restoreOffering, trashOffering } from "../actions";

type Params = { id: string };
type Search = { saved?: string; restored?: string };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const flags = await searchParams;

  const offering = await db.offering.findUnique({
    where: { id },
    include: {
      translations: true,
      items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { translations: true } },
      media: { orderBy: { sortOrder: "asc" }, include: { translations: true } },
    },
  });
  if (!offering) notFound();
  const [images, files] = await Promise.all([imageOptions(), videoFileOptions()]);
  const demo = offering.media.find((m) => m.kind === "VIDEO");
  const mediaValues = {
    screenshots: offering.media.filter((m) => m.kind !== "VIDEO" && m.mediaId).map((m) => m.mediaId!),
    source: (demo ? (demo.videoUrl ? "LINK" : "FILE") : "NONE") as "NONE" | "LINK" | "FILE",
    videoUrl: demo?.videoUrl ?? "",
    videoFileId: demo?.mediaId ?? "",
    posterMediaId: demo?.posterMediaId ?? "",
    captionEn: demo?.translations.find((t) => t.locale === "en")?.caption ?? "",
    captionBn: demo?.translations.find((t) => t.locale === "bn")?.caption ?? "",
  };

  const screenRows = offering.media
    .filter((m) => m.kind !== "VIDEO" && m.mediaId)
    .flatMap((m) => {
      const img = images.find((x) => x.id === m.mediaId);
      if (!img) return [];
      const cap = (l: string) => m.translations.find((t) => t.locale === l)?.caption ?? "";
      return [{ id: m.id, url: img.url, width: img.width, height: img.height, device: m.device ?? "", captionEn: cap("en"), captionBn: cap("bn") }];
    });

  const en = offering.translations.find((t) => t.locale === "en");
  const items: EditorItem[] = offering.items.map((item) => {
    const itemEn = item.translations.find((t) => t.locale === "en");
    const itemBn = item.translations.find((t) => t.locale === "bn");
    return {
      id: item.id,
      kind: item.kind,
      isHidden: item.isHidden,
      en: { title: itemEn?.title ?? "", body: itemEn?.body ?? "" },
      bn: { title: itemBn?.title ?? "", body: itemBn?.body ?? "" },
    };
  });
  const inTrash = Boolean(offering.deletedAt);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/products" className="text-sm text-text-secondary hover:text-brand-sky">
            ← Products
          </Link>
          <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
            {en?.name ?? "Untitled product"}
            <StatusBadge status={offering.status} publishAt={offering.publishAt} deletedAt={offering.deletedAt} />
          </h1>
          <p className="mt-1 text-xs text-text-secondary">
            Last edited{" "}
            {offering.updatedAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        {en?.slug && !inTrash && offering.hasOwnPage && offering.status === "PUBLISHED" && (
          <a
            href={`/en/products/${en.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            View on website ↗
          </a>
        )}
      </div>

      {flags.saved && <Notice>Saved.</Notice>}
      {flags.restored && <Notice>Restored from the trash.</Notice>}

      {inTrash ? (
        <section className="flex flex-col gap-4 rounded-card border border-market-down/30 p-6">
          <p>This product is in the trash and hidden from the website.</p>
          <div className="flex flex-wrap gap-3">
            <form action={restoreOffering}>
              <input type="hidden" name="id" value={offering.id} />
              <button type="submit" className={buttonClasses({})}>
                Restore
              </button>
            </form>
            <form action={deleteOfferingForever}>
              <input type="hidden" name="id" value={offering.id} />
              <ConfirmButton message="Delete this product permanently? This cannot be undone.">Delete permanently</ConfirmButton>
            </form>
          </div>
        </section>
      ) : (
        <>
          <ProductForm values={toProductFormValues(offering)} parentOptions={await parentOptions(offering.id)} images={await imageOptions()} />

          <section id="items" className="flex scroll-mt-24 flex-col gap-4 border-t border-fg/10 pt-8">
            <div>
              <h2 className="font-display text-2xl font-semibold">Page content</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Each list below becomes a section of the product page. Items save individually.
              </p>
            </div>
            <OfferingItemsEditor offeringId={offering.id} items={items} />
          </section>

          <section id="media" className="flex scroll-mt-24 flex-col gap-4 border-t border-fg/10 pt-8">
            <div>
              <h2 className="font-display text-2xl font-semibold">Screens and demo video</h2>
              <p className="mt-1 text-sm text-text-secondary">Shown on the product page as “See it working” and “Inside the product”.</p>
            </div>
            <ProductMediaForm offeringId={offering.id} values={mediaValues} images={images} files={files} />
            <div className="flex flex-col gap-3 border-t border-fg/10 pt-6">
              <h3 className="font-semibold">Screen details</h3>
              <p className="text-sm text-text-secondary">
                Where each screenshot appears in the 3D web, tablet and phone display, and its caption. Upload as many screens as you like; the order above is the order on the page.
              </p>
              <ScreenDetailsForm
                key={screenRows.map((r) => r.id).join()}
                offeringId={offering.id}
                rows={screenRows}
              />
            </div>
          </section>

          <section className="flex items-center justify-between gap-4 border-t border-fg/10 pt-8">
            <p className="text-sm text-text-secondary">Move to trash to hide it from the website. You can restore it from the trash.</p>
            <form action={trashOffering}>
              <input type="hidden" name="id" value={offering.id} />
              <ConfirmButton message="Move this product to the trash? It disappears from the website.">Move to trash</ConfirmButton>
            </form>
          </section>
        </>
      )}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="rounded-control border border-market-up/30 bg-market-up/10 px-4 py-2 text-sm">
      {children}
    </p>
  );
}
