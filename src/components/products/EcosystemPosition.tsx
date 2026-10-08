import Link from "next/link";
import type { EcoGraph, EcoNode } from "@/lib/public/ecosystem";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import { ProductMark, type MarkLogo, type ProductLook } from "./ProductMark";

export type PositionLabels = {
  from: string;
  to: string;
  none: string;
  kinds: Record<string, string>;
  layers: Record<string, string>;
};

type Link_ = { node: EcoNode; kind: string };

const KIND_ICON: Record<string, string> = { DATA: "chart", ORDER: "exchange", RISK: "shield", ONBOARDING: "id", OPERATIONS: "briefcase" };
const LAYER_ICON: Record<string, string> = { MARKET: "globe", PRODUCT: "bolt", INSTITUTION: "briefcase", USER: "users", XFL: "network" };

/**
 * A product's neighbours in the ecosystem (Admin → Ecosystem links): what
 * reaches it and where it passes things on. Xpert Fintech itself is the
 * provider of every product, so a link from it is followed back to its
 * sources (market data from DSE and CSE) or left out.
 */
export function neighbours(graph: EcoGraph, nodeKey: string) {
  const byKey = new Map(graph.nodes.map((n) => [n.key, n]));
  const xfl = new Set(graph.nodes.filter((n) => n.layer === "XFL").map((n) => n.key));
  const seen = new Set<string>();
  const add = (list: Link_[], key: string, kind: string) => {
    const node = byKey.get(key);
    if (!node || key === nodeKey || seen.has(`${list === inbound ? "in" : "out"}:${key}`)) return;
    seen.add(`${list === inbound ? "in" : "out"}:${key}`);
    list.push({ node, kind });
  };
  const inbound: Link_[] = [];
  const outbound: Link_[] = [];
  for (const e of graph.edges) {
    if (e.to === nodeKey) {
      if (xfl.has(e.from)) {
        if (e.kind === "DATA") for (const src of graph.edges) if (src.to === e.from && src.kind === "DATA") add(inbound, src.from, "DATA");
      } else add(inbound, e.from, e.kind);
    }
    if (e.from === nodeKey && !xfl.has(e.to)) add(outbound, e.to, e.kind);
  }
  return { inbound, outbound };
}

function Side({ title, links, labels, align, none }: { title: string; links: Link_[]; labels: PositionLabels; align: "left" | "right"; none?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-3", align === "right" && "md:items-end md:text-right")}>
      <p className="text-sm font-semibold text-text-secondary">{title}</p>
      {links.length === 0 && none && <p className="text-sm text-text-secondary">{none}</p>}
      <ul className={cn("flex w-full flex-col gap-2.5", align === "right" && "md:items-end")}>
        {links.map(({ node, kind }, i) => {
          const body = (
            <>
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-fg/10 bg-fg/[0.04] text-text-secondary">
                <Icon name={LAYER_ICON[node.layer] ?? "network"} className="size-4" />
                <span className="sr-only">{labels.layers[node.layer] ?? node.layer}</span>
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-text-primary">{node.label}</span>
                <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <Icon name={KIND_ICON[kind] ?? "network"} className="size-3.5 text-[var(--p-to)]" />
                  {labels.kinds[kind] ?? kind}
                </span>
              </span>
            </>
          );
          const cls = cn(
            "pos-chip flex w-full max-w-sm items-center gap-3 rounded-2xl border border-fg/10 bg-fg/[0.03] px-3 py-2.5 text-left transition-colors",
            align === "right" && "md:flex-row-reverse md:text-right",
          );
          return (
            <li key={node.key} className="w-full md:max-w-sm" style={{ animationDelay: `${i * 90}ms` }}>
              {node.href ? (
                <Link href={node.href} className={cn(cls, "hover:border-[var(--p-to)]")}>
                  {body}
                </Link>
              ) : (
                <span className={cls}>{body}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** "Receives from → this product → passes to", with packets running along the links. */
export function EcosystemPosition({
  graph,
  nodeKey,
  name,
  productKey,
  logo,
  look,
  labels,
}: {
  graph: EcoGraph;
  nodeKey: string;
  name: string;
  productKey: string | null;
  logo?: MarkLogo | null;
  look?: ProductLook | null;
  labels: PositionLabels;
}) {
  const { inbound, outbound } = neighbours(graph, nodeKey);
  if (!inbound.length && !outbound.length) return null;
  return (
    <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">
      <Side title={labels.from} links={inbound} labels={labels} align="right" none={labels.none} />
      <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4">
        <span aria-hidden="true" className="pos-link pos-link-in" />
        <div className="relative flex flex-col items-center gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--p-to)_45%,transparent)] bg-[color-mix(in_srgb,var(--p-to)_8%,transparent)] px-6 py-5 text-center shadow-[0_0_60px_-20px_var(--p-to)]">
          <span aria-hidden="true" className="pos-pulse absolute inset-0 rounded-3xl" />
          <ProductMark productKey={productKey} logo={logo} look={look} name={name} size="lg" />
          <span className="max-w-[12rem] font-display text-lg leading-tight font-semibold text-balance">{name}</span>
        </div>
        <span aria-hidden="true" className="pos-link pos-link-out" />
      </div>
      <Side title={labels.to} links={outbound} labels={labels} align="left" />
    </div>
  );
}
