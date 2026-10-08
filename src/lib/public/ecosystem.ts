import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import type { AppLocale } from "@/lib/i18n/config";
import type { EcosystemModuleInfo, EcosystemModuleKey } from "@/components/flagship/EcosystemMap";
import { pick } from "./text";

/** A node visitors may see, in their language. */
export type EcoNode = {
  key: string;
  layer: "MARKET" | "XFL" | "PRODUCT" | "INSTITUTION" | "USER";
  label: string;
  description: string | null;
  cta: string | null;
  /** Product page, when the node is linked to a published product. */
  href: string | null;
  mobileOrder: number;
  /** Key of the published product this node stands for. */
  product?: string | null;
};
export type EcoEdge = { from: string; to: string; kind: string };
export type EcoStep = { node: string; title: string; body: string | null };
export type EcoFlow = { key: string; name: string; isPlayback: boolean; steps: EcoStep[] };
export type EcoGraph = { nodes: EcoNode[]; edges: EcoEdge[]; flows: EcoFlow[] };

/** Ecosystem node keys that are modules on the map's ring. */
export const NODE_MODULE: Record<string, EcosystemModuleKey> = {
  oms: "OMS",
  rms: "RMS",
  dms: "DMS",
  "bo-account-opening": "BO",
  ekyc: "eKYC",
  "back-office": "Back office",
};

/**
 * The ecosystem as Admin → Ecosystem defines it, filtered for visitors:
 * published nodes with a label in this language (English as fallback),
 * links whose both ends are visible, and published flows whose steps only
 * touch visible nodes (so an unpublished product such as eKYC simply drops
 * out of the tour). A product node links to its page only when the product
 * itself is published.
 */
export const getEcosystem = cache(async (locale: AppLocale): Promise<EcoGraph> => {
  try {
    const now = new Date();
    const [rows, edges, flows] = await Promise.all([
      db.ecosystemNode.findMany({ where: publishedWhere(now), orderBy: [{ mobileOrder: "asc" }, { sortOrder: "asc" }], include: { translations: true } }),
      db.ecosystemEdge.findMany({ orderBy: { sortOrder: "asc" }, include: { from: { select: { key: true } }, to: { select: { key: true } } } }),
      db.ecosystemFlow.findMany({
        where: publishedWhere(now),
        orderBy: { sortOrder: "asc" },
        include: { translations: true, steps: { orderBy: { sortOrder: "asc" }, include: { translations: true, node: { select: { key: true } } } } },
      }),
    ]);
    const offeringIds = rows.map((r) => r.offeringId).filter((x): x is string => Boolean(x));
    const offerings = offeringIds.length
      ? await db.offering.findMany({ where: { id: { in: offeringIds }, ...publishedWhere(now), hasOwnPage: true }, include: { translations: true } })
      : [];
    const hrefById = new Map<string, string>();
    const keyById = new Map<string, string | null>(offerings.map((o) => [o.id, o.key ?? null]));
    for (const o of offerings) {
      const tr = pick(o.translations, locale);
      const own = o.translations.find((x) => x.locale === locale);
      if (tr) hrefById.set(o.id, `/${own ? locale : "en"}/products/${(own ?? tr).slug}`);
    }
    const nodes: EcoNode[] = [];
    for (const r of rows) {
      const tr = pick(r.translations, locale);
      if (!tr) continue;
      nodes.push({
        key: r.key,
        layer: r.layer,
        label: tr.label,
        description: tr.description,
        cta: tr.ctaLabel,
        href: r.offeringId ? (hrefById.get(r.offeringId) ?? null) : null,
        mobileOrder: r.mobileOrder,
        product: r.offeringId ? (keyById.get(r.offeringId) ?? null) : null,
      });
    }
    const visible = new Set(nodes.map((n) => n.key));
    const publicEdges = edges.filter((e) => visible.has(e.from.key) && visible.has(e.to.key)).map((e) => ({ from: e.from.key, to: e.to.key, kind: e.kind }));
    const publicFlows: EcoFlow[] = [];
    for (const f of flows) {
      const name = pick(f.translations, locale)?.name;
      if (!name) continue;
      const steps = f.steps
        .filter((s) => visible.has(s.node.key))
        .map((s) => {
          const tr = pick(s.translations, locale);
          return tr ? { node: s.node.key, title: tr.title, body: tr.body } : null;
        })
        .filter((s): s is EcoStep => s !== null);
      if (steps.length) publicFlows.push({ key: f.key, name, isPlayback: f.isPlayback, steps });
    }
    return { nodes, edges: publicEdges, flows: publicFlows };
  } catch (error) {
    console.error("[ecosystem] could not load", error);
    return { nodes: [], edges: [], flows: [] };
  }
});

/**
 * Applies Admin → Ecosystem to the map's ring modules: a module whose node is
 * unpublished is hidden; its description and link come from the node when
 * set there, otherwise from the product. The ring keeps its short names
 * (OMS, RMS, BO…) so the pills fit; full names appear in the tour and on phones.
 */
export function withEcosystem(
  modules: Partial<Record<EcosystemModuleKey, EcosystemModuleInfo>>,
  graph: EcoGraph,
  hasNodes: boolean,
): Partial<Record<EcosystemModuleKey, EcosystemModuleInfo>> {
  if (!hasNodes) return modules;
  const out = { ...modules };
  const byKey = new Map(graph.nodes.map((n) => [n.key, n]));
  for (const [nodeKey, mod] of Object.entries(NODE_MODULE)) {
    const n = byKey.get(nodeKey);
    const base = modules[mod] ?? {};
    if (!n) {
      out[mod] = { ...base, available: false };
      continue;
    }
    out[mod] = {
      ...base,
      description: n.description ?? base.description,
      href: n.href ?? base.href,
    };
  }
  return out;
}

/** True once the ecosystem has been seeded or edited (so the database decides). */
export const ecosystemInDatabase = cache(async () => {
  try {
    return (await db.ecosystemNode.count()) > 0;
  } catch {
    return false;
  }
});
