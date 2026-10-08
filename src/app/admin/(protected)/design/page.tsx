import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { ConfirmButton } from "@/components/admin/AdminUi";
import { DesignForm } from "@/components/admin/DesignForm";
import { COLOR_FIELDS, getDesign, HOME_SECTIONS, TONE_FIELDS } from "@/lib/content/design";
import { iconFor } from "@/lib/content/nav-icons";
import { PRODUCT_STYLE } from "@/components/products/ProductMark";
import { ICON_NAMES } from "@/components/ui/Icon";
import { resetDesign } from "./actions";

/** Built-in colours, shown as placeholders so an editor sees what an empty field means. */
const DEFAULT_COLORS: Record<string, string> = { royal: "#2a5fae", sky: "#22bceb", skyLight: "#065f8f", gold: "#e0b252", goldLight: "#7a520a" };
const DEFAULT_TONES: Record<string, string> = { board: "#d4a24c", management: "#22bceb", consultant: "#14b8a6", team: "#8b5cf6" };

export default async function DesignPage() {
  await requireAdmin();
  const [design, offerings, menu] = await Promise.all([
    getDesign(),
    db.offering.findMany({ where: { deletedAt: null, status: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, include: { translations: { where: { locale: "en" } } } }),
    db.navMenu.findUnique({
      where: { key: "header" },
      include: { items: { where: { isHidden: false }, orderBy: { sortOrder: "asc" }, include: { translations: { where: { locale: "en" } } } } },
    }),
  ]);
  const items = menu?.items ?? [];
  const nav: { path: string; label: string; depth: number; icon: string; auto: string }[] = [];
  const seen = new Set<string>();
  const add = (parentId: string | null, depth: number) => {
    for (const i of items.filter((x) => x.parentId === parentId)) {
      const path = (i.href ?? "").replace(/^\/+/, "").replace(/\/+$/, "");
      if (i.href && !/^https?:/.test(i.href) && !seen.has(path)) {
        seen.add(path);
        nav.push({ path, label: i.translations[0]?.label ?? path, depth, icon: design.navIcons[path] ?? "", auto: iconFor(`/${path}`) });
      }
      add(i.id, depth + 1);
    }
  };
  add(null, 0);

  return (
    <div className="flex max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Design</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            Colours, icons and home-page sections for the whole website. Words are edited in Admin → Site text; menu links in Admin → Navigation; each
            page&rsquo;s sections in Admin → Pages.
          </p>
        </div>
        <form action={resetDesign}>
          <ConfirmButton message="Go back to the built-in colours, icons and sections?" className="text-sm text-text-secondary hover:text-market-down">
            Reset to the built-in design
          </ConfirmButton>
        </form>
      </div>
      <DesignForm
        values={{
          colors: COLOR_FIELDS.map((f) => ({ key: f.key, label: f.label, value: design.colors[f.key] ?? "", placeholder: DEFAULT_COLORS[f.key]! })),
          tones: TONE_FIELDS.map((f) => ({ key: f.key, label: f.label, value: design.tones[f.key] ?? "", placeholder: DEFAULT_TONES[f.key]! })),
          products: offerings
            .filter((o) => o.key)
            .map((o) => {
              const d = PRODUCT_STYLE[o.key!] ?? { from: "#1e3a8a", to: "#22bceb", icon: "bolt" };
              const p = design.products[o.key!] ?? {};
              return { key: o.key!, name: o.translations[0]?.name ?? o.key!, from: p.from ?? "", to: p.to ?? "", icon: p.icon ?? "", defaults: { from: d.from, to: d.to, icon: d.icon } };
            }),
          nav,
          home: HOME_SECTIONS.map((h) => ({ key: h.key, label: h.label, shown: !design.hidden.includes(h.key) })),
          icons: ICON_NAMES,
        }}
      />
    </div>
  );
}
