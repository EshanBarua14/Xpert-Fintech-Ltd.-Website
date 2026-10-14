import "server-only";
import { db } from "@/lib/db/client";
import { delegateName, idField, models, ownedLists, readSnapshot, recordRevision, type ChildRel } from "@/lib/db/revision-capture";
import { requireAdmin } from "@/lib/auth/session";

/** What each table is called in the admin, and where its editor is. */
export const SECTION: Record<string, { label: string; edit?: (id: string) => string }> = {
  Page: { label: "Page", edit: (id) => `/admin/pages/${id}` },
  PageSection: { label: "Page section" },
  ContentBlock: { label: "Page block" },
  BlockItem: { label: "Block item" },
  NavMenu: { label: "Menu", edit: () => "/admin/navigation" },
  NavItem: { label: "Menu link", edit: () => "/admin/navigation" },
  Offering: { label: "Product", edit: (id) => `/admin/products/${id}` },
  OfferingItem: { label: "Product item" },
  OfferingMedia: { label: "Product screenshot" },
  OfferingCategory: { label: "Product category" },
  Solution: { label: "Solution" },
  Organization: { label: "Organization", edit: (id) => `/admin/organizations/${id}` },
  Deployment: { label: "App deployment", edit: (id) => `/admin/deployments/${id}` },
  CaseStudy: { label: "Case study", edit: (id) => `/admin/case-studies/${id}` },
  Testimonial: { label: "Testimonial", edit: (id) => `/admin/testimonials/${id}` },
  Certification: { label: "Credential", edit: () => "/admin/credentials" },
  Metric: { label: "Figure" },
  Person: { label: "Person", edit: (id) => `/admin/people/${id}` },
  PersonRole: { label: "Person's role" },
  Career: { label: "Job", edit: (id) => `/admin/careers/${id}` },
  CareerApplication: { label: "Job application", edit: (id) => `/admin/applications/${id}` },
  ArticleCategory: { label: "News category", edit: () => "/admin/news/categories" },
  Tag: { label: "News tag", edit: () => "/admin/news/tags" },
  Article: { label: "News story", edit: (id) => `/admin/news/${id}` },
  Event: { label: "Event", edit: (id) => `/admin/events/${id}` },
  Album: { label: "Photo album", edit: (id) => `/admin/albums/${id}` },
  Video: { label: "Video", edit: (id) => `/admin/videos/${id}` },
  Resource: { label: "Resource", edit: (id) => `/admin/resources/${id}` },
  Media: { label: "Media file", edit: (id) => `/admin/media/${id}` },
  MediaFolder: { label: "Media folder" },
  Lead: { label: "Lead", edit: (id) => `/admin/leads/${id}` },
  LeadActivity: { label: "Lead note" },
  MarketDataSource: { label: "Market data source", edit: () => "/admin/market" },
  MarketShare: { label: "Market share figure", edit: () => "/admin/market" },
  SeoMetadata: { label: "SEO settings" },
  Redirect: { label: "Redirect", edit: () => "/admin/redirects" },
  EcosystemNode: { label: "Ecosystem box", edit: (id) => `/admin/ecosystem/nodes/${id}` },
  EcosystemEdge: { label: "Ecosystem link", edit: () => "/admin/ecosystem" },
  EcosystemFlow: { label: "Ecosystem flow", edit: (id) => `/admin/ecosystem/flows/${id}` },
  Office: { label: "Office", edit: () => "/admin/settings" },
  SiteSetting: { label: "Setting" },
  EventMedia: { label: "Event photo" },
  AlbumMedia: { label: "Album photo" },
  ArticleTag: { label: "Story tag" },
  EventOrganization: { label: "Event participant" },
  EcosystemFlowStep: { label: "Flow step" },
};

/** Settings stored by key, named the way the admin names them. */
const SETTING_LABEL: [RegExp, string, string][] = [
  [/^site\.design/, "Design", "/admin/design"],
  [/^site\.figures/, "Figures", "/admin/figures"],
  [/^message\./, "Leader message", "/admin/messages"],
  [/^market\./, "Market data setting", "/admin/market"],
  [/^text\.|^i18n\.|overrides/, "Site text", "/admin/site-text"],
  [/^reviews\./, "Testimonials setting", "/admin/testimonials"],
  [/^credentials|^company\.|^contact\.|^social\.|^leads\./, "Settings", "/admin/settings"],
];
export function describe(model: string, entityId: string): { section: string; edit?: string } {
  if (model === "SiteSetting") {
    const hit = SETTING_LABEL.find(([re]) => re.test(entityId));
    return { section: hit ? hit[1] : "Setting", edit: hit?.[2] };
  }
  const s = SECTION[model];
  return { section: s?.label ?? model, edit: s?.edit?.(entityId) };
}

type Row = Record<string, unknown>;

/** The plain values of a stored copy, ready to write back (dates as dates, no links or automatic fields). */
function values(model: string, row: Row, omit: string[] = []): Row {
  const m = models().get(model);
  if (!m) return {};
  const out: Row = {};
  for (const f of m.fields) {
    if (f.kind === "object" || f.isUpdatedAt || omit.includes(f.name) || !(f.name in row)) continue;
    if (f.type === "Bytes") continue;
    const v = row[f.name];
    out[f.name] = f.type === "DateTime" && typeof v === "string" ? new Date(v) : v === null && f.type === "Json" ? undefined : v;
  }
  return out;
}

type Delegate = {
  findUnique: (a: unknown) => Promise<unknown>;
  update: (a: unknown) => Promise<unknown>;
  create: (a: unknown) => Promise<unknown>;
  deleteMany: (a: unknown) => Promise<unknown>;
};
const delegateOf = (client: unknown, model: string) => (client as Record<string, Delegate>)[delegateName(model)]!;

/** Writes the lists that belonged to the record back exactly as they were. */
async function restoreLists(tx: unknown, rels: ChildRel[], parentId: unknown, snapshot: Row) {
  for (const rel of rels) {
    const rows = snapshot[rel.field];
    if (!Array.isArray(rows)) continue;
    const d = delegateOf(tx, rel.model);
    await d.deleteMany({ where: { [rel.fk]: parentId } });
    for (const child of rows as Row[]) {
      const nested = Object.fromEntries(
        rel.children
          .filter((g) => Array.isArray(child[g.field]))
          .map((g) => [g.field, { create: (child[g.field] as Row[]).map((gr) => values(g.model, gr, [g.fk])) }]),
      );
      await d.create({ data: { ...values(rel.model, child), ...nested } });
    }
  }
}

export type RestoreResult = { ok: true; model: string; entityId: string } | { ok: false; message: string };

/**
 * Puts a record back the way it was in a revision. The state it is in now is
 * kept as a new revision first (the database client does that), so a restore
 * can itself be undone.
 */
export async function restoreRevision(revisionId: string): Promise<RestoreResult> {
  const rev = await db.revision.findUnique({ where: { id: revisionId } });
  if (!rev) return { ok: false, message: "That version no longer exists." };
  const model = rev.model;
  const idName = idField(model);
  if (!idName || !models().get(model)) return { ok: false, message: `${model} cannot be restored.` };
  const snap = rev.snapshot as Row;
  const id = snap[idName];
  const rels = ownedLists(model) ?? [];
  // The version being replaced is kept first, so this restore can be undone too.
  const admin = await requireAdmin();
  const current = await readSnapshot(db, model, { [idName]: id });
  if (current) await recordRevision(db, model, current, "restore", admin.id);
  try {
    await db.$transaction(async (tx) => {
      const d = delegateOf(tx, model);
      const exists = await d.findUnique({ where: { [idName]: id } });
      if (exists) await d.update({ where: { [idName]: id }, data: values(model, snap, [idName]) });
      else await d.create({ data: values(model, snap) });
      await restoreLists(tx, rels, id, snap);
    });
  } catch (error) {
    const msg = (error as { code?: string; message?: string })?.code === "P2002"
      ? "Another item now uses the same address, key or name. Change that item first, then try again."
      : (error as { code?: string })?.code === "P2003"
        ? "Something this version points to has been deleted for good, so it cannot be put back as it was."
        : "Could not restore this version.";
    console.error("[revisions] restore failed", revisionId, error);
    return { ok: false, message: msg };
  }
  return { ok: true, model, entityId: String(rev.entityId) };
}
