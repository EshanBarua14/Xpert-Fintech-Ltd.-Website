import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { TrashControls } from "@/components/admin/EditorParts";
import { PageSettingsForm, type PageFormValues } from "@/components/admin/PageSettingsForm";
import { PageBuilder, type BuilderSection } from "@/components/admin/PageBuilder";
import { imageOptions } from "@/lib/admin/media";
import { toLocalInput } from "@/lib/validation/common";
import { deletePageForever, restorePage, trashPage } from "../actions";

const emptyLang = { title: "", path: "", intro: "", seoTitle: "", seoDescription: "" };
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export default async function PageEditor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; restored?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;
  const images = await imageOptions();

  if (id === "new") {
    const values: PageFormValues = {
      isHome: false,
      template: "default",
      status: "DRAFT",
      publishAt: "",
      showInSearch: true,
      ogImageId: "",
      en: { ...emptyLang },
      bn: { ...emptyLang },
    };
    return (
      <div className="flex flex-col gap-6">
        <Back />
        <h1 className="font-display text-3xl font-semibold">New page</h1>
        <p className="text-sm text-text-secondary">Create the page first; you can add sections and blocks after saving.</p>
        <PageSettingsForm values={values} images={images} />
      </div>
    );
  }

  if (!z.string().uuid().safeParse(id).success) notFound();
  const page = await db.page.findUnique({
    where: { id },
    include: {
      translations: true,
      sections: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          blocks: {
            where: { deletedAt: null },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: {
              translations: true,
              items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { translations: true } },
            },
          },
        },
      },
    },
  });
  if (!page) notFound();
  const seo = await db.seoMetadata.findMany({ where: { entityType: "PAGE", entityId: page.id } });

  const lang = (l: "en" | "bn") => {
    const t = page.translations.find((x) => x.locale === l);
    const s = seo.find((x) => x.locale === l);
    return t
      ? { title: t.title, path: t.path, intro: t.intro ?? "", seoTitle: s?.title ?? "", seoDescription: s?.description ?? "" }
      : { ...emptyLang };
  };

  const sections: BuilderSection[] = page.sections.map((s) => ({
    id: s.id,
    variant: s.variant,
    anchorId: s.anchorId ?? "",
    isHidden: s.isHidden,
    blocks: s.blocks.map((b) => {
      const t = (l: string) => b.translations.find((x) => x.locale === l);
      const text = (l: string) => ({
        eyebrow: t(l)?.eyebrow ?? "",
        title: t(l)?.title ?? "",
        subtitle: t(l)?.subtitle ?? "",
        body: t(l)?.body ?? "",
        ctaLabel: t(l)?.ctaLabel ?? "",
        ctaHref: t(l)?.ctaHref ?? "",
      });
      return {
        id: b.id,
        type: b.type,
        status: b.status,
        publishAt: toLocalInput(b.publishAt),
        isHidden: b.isHidden,
        props: obj(b.props),
        en: text("en"),
        bn: text("bn"),
        items: b.items.map((item) => {
          const it = (l: string) => item.translations.find((x) => x.locale === l);
          const itemText = (l: string) => ({
            title: it(l)?.title ?? "",
            subtitle: it(l)?.subtitle ?? "",
            body: it(l)?.body ?? "",
            ctaLabel: it(l)?.ctaLabel ?? "",
          });
          return {
            id: item.id,
            isHidden: item.isHidden,
            mediaId: item.mediaId ?? "",
            linkUrl: item.linkUrl ?? "",
            iconName: item.iconName ?? "",
            props: obj(item.props),
            en: itemText("en"),
            bn: itemText("bn"),
          };
        }),
      };
    }),
  }));

  const en = lang("en");
  return (
    <div className="flex flex-col gap-10">
      <div>
        <Back />
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {en.title || "Untitled page"}
          <StatusBadge status={page.status} publishAt={page.publishAt} deletedAt={page.deletedAt} />
        </h1>
        <p className="mt-1 text-xs text-text-secondary">
          /en{en.path ? `/${en.path}` : ""} · Last edited {formatDhaka(page.updatedAt)}
        </p>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      {flags.restored && <Notice tone="success">Restored from the trash.</Notice>}

      {!page.deletedAt && (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-2xl font-semibold">Page settings</h2>
            <PageSettingsForm
              images={images}
              values={{
                id: page.id,
                isHome: page.key === "home",
                template: (["default", "landing", "legal"] as const).find((t) => t === page.template) ?? "default",
                status: page.status,
                publishAt: toLocalInput(page.publishAt),
                showInSearch: page.showInSearch,
                ogImageId: seo.find((s) => s.locale === "en")?.ogImageId ?? "",
                en,
                bn: lang("bn"),
              }}
            />
          </section>
          <section className="flex flex-col gap-4 border-t border-white/10 pt-8">
            <div>
              <h2 className="font-display text-2xl font-semibold">Content</h2>
              <p className="mt-1 text-sm text-text-secondary">
                A page is a stack of sections; each section holds blocks; many blocks hold cards. Every part can be added,
                edited, hidden, reordered or deleted.
              </p>
            </div>
            <PageBuilder pageId={page.id} sections={sections} images={images} />
          </section>
        </>
      )}

      <TrashControls
        id={page.id}
        inTrash={Boolean(page.deletedAt)}
        noun="page"
        onTrash={trashPage}
        onRestore={restorePage}
        onDelete={deletePageForever}
        deleteBlockedReason={page.key ? "System pages such as Home and About can be restored but not deleted." : null}
      />
    </div>
  );
}

function Back() {
  return (
    <Link href="/admin/pages" className="text-sm text-text-secondary hover:text-brand-sky">
      ← Pages
    </Link>
  );
}
