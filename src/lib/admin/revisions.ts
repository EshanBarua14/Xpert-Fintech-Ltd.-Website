import "server-only";
import { db } from "@/lib/db/client";
import { delegateName, idField, models, ownedLists, quietly, readSnapshot, recordRevision, type ChildRel } from "@/lib/db/revision-capture";
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
  CaseStudy: { label: "Success story", edit: (id) => `/admin/case-studies/${id}` },
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

type Rev = { id: string; model: string; entityId: string; action: string; label: string | null; snapshot: unknown; createdAt: Date; undoOf?: string | null };

const hasDeletedAt = (model: string) => !!models().get(model)?.fields.some((f) => f.name === "deletedAt");

function problem(error: unknown): string {
  const code = (error as { code?: string })?.code;
  return code === "P2002"
    ? "Another item now uses the same address, key or name. Change that item first, then try again."
    : code === "P2003"
      ? "Something this version points to has been deleted for good, so it cannot be put back as it was."
      : "Could not restore this version.";
}

/** Writes a stored version back (record and its own lists). Nothing here is recorded as a new change. */
async function writeBack(rev: Rev) {
  const model = rev.model;
  const idName = idField(model)!;
  const snap = rev.snapshot as Row;
  const id = snap[idName];
  const rels = ownedLists(model) ?? [];
  await quietly(() =>
    db.$transaction(async (tx) => {
      const d = delegateOf(tx, model);
      const exists = await d.findUnique({ where: { [idName]: id } });
      if (exists) await d.update({ where: { [idName]: id }, data: values(model, snap, [idName]) });
      else await d.create({ data: values(model, snap) });
      await restoreLists(tx, rels, id, snap);
    }),
  );
}

/** Takes away an item that was added: to the trash when the table has one, otherwise deleted (its copy is kept first). */
async function removeAdded(rev: Rev) {
  const idName = idField(rev.model)!;
  const id = (rev.snapshot as Row)[idName];
  await quietly(async () => {
    const d = delegateOf(db, rev.model);
    if (!(await d.findUnique({ where: { [idName]: id } }))) return;
    if (hasDeletedAt(rev.model)) await d.update({ where: { [idName]: id }, data: { deletedAt: new Date() } });
    else await (d as unknown as { delete: (a: unknown) => Promise<unknown> }).delete({ where: { [idName]: id } });
  });
}

/**
 * Puts a record back the way it was in a revision (Admin → History). The state
 * it is in now is kept first as a new change, so this restore can itself be
 * undone with Undo or from History.
 */
export async function restoreRevision(revisionId: string): Promise<RestoreResult> {
  const rev = (await db.revision.findUnique({ where: { id: revisionId } })) as Rev | null;
  if (!rev) return { ok: false, message: "That version no longer exists." };
  const idName = idField(rev.model);
  if (!idName || !models().get(rev.model)) return { ok: false, message: `${rev.model} cannot be restored.` };
  const admin = await requireAdmin();
  const id = (rev.snapshot as Row)[idName];
  const current = await readSnapshot(db, rev.model, { [idName]: id });
  try {
    if (rev.action === "create") {
      // "Added …": restoring the version before it means taking the item away again.
      if (current) await recordRevision(db, rev.model, current, "update", admin.id);
      await removeAdded(rev);
    } else {
      if (current) await recordRevision(db, rev.model, current, "update", admin.id);
      else await recordRevision(db, rev.model, { [idName]: id, ...(rev.snapshot as Row) }, "create", admin.id);
      await writeBack(rev);
    }
  } catch (error) {
    console.error("[revisions] restore failed", revisionId, error);
    return { ok: false, message: problem(error) };
  }
  return { ok: true, model: rev.model, entityId: String(rev.entityId) };
}

// ── Undo and redo ──────────────────────────────────────────────────────────
// Each admin has their own stack. One save can touch several records (an
// event and its photos, a page and its blocks); everything recorded within a
// moment of each other is one step, undone and redone together.

const STEP_GAP_MS = 1500;

function oneStep<T extends { createdAt: Date }>(rows: T[]): T[] {
  const out: T[] = [];
  for (const r of rows) {
    const prev = out[out.length - 1];
    if (prev && prev.createdAt.getTime() - r.createdAt.getTime() > STEP_GAP_MS) break;
    out.push(r);
  }
  return out;
}

export type StepInfo = { label: string; count: number; at: Date } | null;

function stepLabel(rows: Rev[]): string {
  const first = rows.find((r) => r.action === "create" && r.label) ?? rows.find((r) => r.label) ?? rows[0]!;
  const d = describe(first.model, first.entityId);
  const verb = first.action === "create" ? "Adding" : first.action === "delete" ? "Deleting" : "Changing";
  return `${verb} ${d.section.toLowerCase()}${first.label ? `: ${first.label}` : ""}`;
}

async function undoCandidates(actorId: string) {
  return (await db.revision.findMany({
    where: { actorId, action: { in: ["create", "update", "delete"] }, undoneAt: null },
    orderBy: { createdAt: "desc" },
    take: 60,
  })) as Rev[];
}

async function redoCandidates(actorId: string) {
  // Only what is still waiting: a newer change closes the redo stack.
  return (await db.revision.findMany({
    where: { actorId, undoOf: { not: null }, redoneAt: null },
    orderBy: { createdAt: "desc" },
    take: 60,
  })) as Rev[];
}

/** What Undo and Redo would do now, for the admin bar. */
export async function undoRedoState(actorId: string): Promise<{ undo: StepInfo; redo: StepInfo }> {
  const [u, r] = await Promise.all([undoCandidates(actorId), redoCandidates(actorId)]);
  const us = oneStep(u);
  const rs = oneStep(r);
  return {
    undo: us.length ? { label: stepLabel(us), count: us.length, at: us[0]!.createdAt } : null,
    redo: rs.length ? { label: stepLabel(rs.map((x) => ({ ...x, action: "update" }))), count: rs.length, at: rs[0]!.createdAt } : null,
  };
}

export type StepResult = { ok: true; label: string } | { ok: false; message: string };

/** Undoes this admin's most recent change (one save, with everything it touched). */
export async function undoLast(): Promise<StepResult> {
  const admin = await requireAdmin();
  const step = oneStep(await undoCandidates(admin.id));
  if (!step.length) return { ok: false, message: "There is nothing to undo." };
  // Per record, the version from before the step (the oldest copy in it).
  // An item added in this step is taken away; otherwise its oldest copy in the step is put back.
  const byEntity = new Map<string, Rev>();
  for (const r of step) {
    const k = `${r.model}:${r.entityId}`;
    const had = byEntity.get(k);
    if (!had || r.action === "create" || (had.action !== "create" && r.createdAt.getTime() <= had.createdAt.getTime())) byEntity.set(k, r);
  }
  const items = [...byEntity.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const label = stepLabel(step);
  try {
    // Changes and deletions first (parents before their lists), then take away what was added.
    for (const r of [...items.filter((x) => x.action !== "create"), ...items.filter((x) => x.action === "create").reverse()]) {
      const idName = idField(r.model);
      if (!idName) continue;
      const now = await readSnapshot(db, r.model, { [idName]: (r.snapshot as Row)[idName] });
      // Keep the state being undone, for Redo.
      if (now) await recordRevision(db, r.model, now, "restore", admin.id, { undoOf: r.id });
      if (r.action === "create") await removeAdded(r);
      else await writeBack(r);
    }
  } catch (error) {
    console.error("[revisions] undo failed", error);
    return { ok: false, message: problem(error) };
  }
  await db.revision.updateMany({ where: { id: { in: step.map((r) => r.id) } }, data: { undoneAt: new Date() } });
  return { ok: true, label };
}

/** Redoes the last undone step (until a newer change is made). */
export async function redoLast(): Promise<StepResult> {
  const admin = await requireAdmin();
  const step = oneStep(await redoCandidates(admin.id));
  if (!step.length) return { ok: false, message: "There is nothing to redo." };
  const label = stepLabel(step.map((x) => ({ ...x, action: "update" })));
  try {
    for (const r of [...step].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) await writeBack(r);
  } catch (error) {
    console.error("[revisions] redo failed", error);
    return { ok: false, message: problem(error) };
  }
  await db.revision.updateMany({ where: { id: { in: step.map((r) => r.id) } }, data: { redoneAt: new Date() } });
  const originals = step.map((r) => r.undoOf).filter((x): x is string => !!x);
  await db.revision.updateMany({ where: { id: { in: originals } }, data: { undoneAt: null } });
  return { ok: true, label };
}
