import Link from "next/link";
import type { CSSProperties } from "react";
import type { Messages } from "@/lib/i18n/messages";
import type { ShowcaseProduct } from "@/lib/public/showcase";
import { Icon } from "@/components/ui/Icon";
import { ProductMark } from "@/components/products/ProductMark";

/**
 * "Built for every desk": the same products seen from the people who use
 * them — investors, dealers, operations and compliance, and the brokerage's
 * management — each with the products that serve that desk. Only published
 * products are linked; a desk with none is left out.
 */
const ROLES: { key: "Investor" | "Dealer" | "Ops" | "Mgmt"; icon: string; products: string[] }[] = [
  { key: "Investor", icon: "users", products: ["bo-account-opening", "ekyc", "ost", "smart-stock"] },
  { key: "Dealer", icon: "exchange", products: ["trading-platform"] },
  { key: "Ops", icon: "document", products: ["back-office", "dms", "ekyc"] },
  { key: "Mgmt", icon: "chart", products: ["trading-platform", "back-office"] },
];

export function RoleGuide({ t, products }: { t: Messages; products: ShowcaseProduct[] }) {
  const byKey = new Map(products.map((p) => [p.key, p]));
  const roles = ROLES.map((r) => ({ ...r, items: r.products.map((k) => byKey.get(k)).filter((p): p is ShowcaseProduct => !!p) })).filter((r) => r.items.length);
  if (!roles.length) return null;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {roles.map((r, i) => (
        <li key={r.key} data-reveal style={{ "--d": i } as CSSProperties} className="flex flex-col gap-5 rounded-3xl border border-fg/[0.08] bg-fg/[0.02] p-6">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-sky/10 text-brand-sky">
            <Icon name={r.icon} className="size-5" />
          </span>
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-xl leading-snug font-semibold">{t[`role${r.key}Title`]}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{t[`role${r.key}Body`]}</p>
          </div>
          <ul className="mt-auto flex flex-col gap-2 border-t border-fg/[0.08] pt-4">
            {r.items.map((p) => (
              <li key={p.id}>
                <Link href={p.href} className="group flex items-center gap-3 rounded-xl py-1 text-sm font-semibold text-text-primary hover:text-brand-sky">
                  <ProductMark productKey={p.key} logo={p.logo} look={p.look} size="sm" className="size-7 rounded-lg [&_svg]:size-3.5" />
                  <span className="min-w-0 flex-1 leading-snug">{p.name}</span>
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 shrink-0 fill-none stroke-current stroke-[1.8] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
