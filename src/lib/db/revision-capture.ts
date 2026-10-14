import { Prisma, type PrismaClient } from "@prisma/client";

/*
 * Revisions: before an admin changes or deletes a record, its current state is
 * copied into the Revision table, so any change can be undone from Admin →
 * History (like WordPress revisions and trash). A copy holds the record, its
 * translations and the small lists that belong only to it (an event's photos,
 * a person's roles, a product's items, a flow's steps), each with their
 * translations. Bookkeeping tables are not copied.
 *
 * The shape of every table comes from Prisma's own model description (dmmf),
 * so new tables are covered without changes here.
 */

type DField = {
  name: string;
  kind: "scalar" | "object" | "enum" | "unsupported";
  type: string;
  isList: boolean;
  isId: boolean;
  isUpdatedAt?: boolean;
  relationFromFields?: readonly string[];
  relationOnDelete?: string;
  relationName?: string;
};
type DModel = { name: string; fields: readonly DField[] };

/** Never copied: sign-in data, bookkeeping, the log and the copies themselves. */
const UNTRACKED = new Set([
  "AdminUser",
  "Session",
  "PasswordReset",
  "StoredFile",
  "AuditLog",
  "Revision",
  "MediaUsage",
  "ContentRelation",
]);

let modelsCache: Map<string, DModel> | null = null;
export function models(): Map<string, DModel> {
  if (modelsCache) return modelsCache;
  const list = ((Prisma as unknown as { dmmf?: { datamodel?: { models?: DModel[] } } }).dmmf?.datamodel?.models ?? []) as DModel[];
  modelsCache = new Map(list.map((m) => [m.name, m]));
  return modelsCache;
}

export const delegateName = (model: string) => model.charAt(0).toLowerCase() + model.slice(1);

export function idField(model: string): string | null {
  return models().get(model)?.fields.find((f) => f.isId)?.name ?? null;
}

/** The field on `child` that points (with cascade) at `parent`, if the child belongs to the parent. */
function ownerLink(child: DModel, parent: string): DField | undefined {
  return child.fields.find((f) => f.kind === "object" && f.type === parent && (f.relationFromFields?.length ?? 0) > 0 && f.relationOnDelete === "Cascade");
}

export type ChildRel = { field: string; model: string; fk: string; children: ChildRel[] };

/**
 * The lists that belong to a record: cascade-deleted with it. A list is kept
 * only when its rows own nothing but their translations (so restoring never
 * wipes deeper content such as a page's sections and blocks).
 */
export function ownedLists(model: string, depth = 0): ChildRel[] | null {
  const m = models().get(model);
  if (!m) return null;
  const out: ChildRel[] = [];
  for (const f of m.fields) {
    if (f.kind !== "object" || !f.isList || UNTRACKED.has(f.type)) continue;
    const child = models().get(f.type);
    if (!child) continue;
    const link = ownerLink(child, model);
    if (!link) continue;
    const isTranslation = f.type.endsWith("Translation");
    if (depth > 0 && !isTranslation) return null; // a child with lists of its own: not copied
    const grand = isTranslation ? [] : ownedLists(f.type, depth + 1);
    if (grand === null) continue;
    out.push({ field: f.name, model: f.type, fk: link.relationFromFields![0]!, children: grand });
  }
  return out;
}

function includeFor(rels: ChildRel[]): Record<string, unknown> | undefined {
  if (!rels.length) return undefined;
  return Object.fromEntries(rels.map((r) => [r.field, r.children.length ? { include: includeFor(r.children) } : true]));
}

export function isTracked(model: string) {
  return !UNTRACKED.has(model) && !!models().get(model) && !!idField(model);
}

/** For a translation table: the record it translates and the field that links them. */
export function translationOwner(model: string): { model: string; fk: string } | null {
  if (!model.endsWith("Translation")) return null;
  const m = models().get(model);
  const link = m?.fields.find((f) => f.kind === "object" && (f.relationFromFields?.length ?? 0) > 0 && f.relationOnDelete === "Cascade");
  return link ? { model: link.type, fk: link.relationFromFields![0]! } : null;
}

/** A short name for the record, from its English text or its key. */
export function labelOf(snapshot: Record<string, unknown>): string {
  const trs = (snapshot.translations as Record<string, unknown>[] | undefined) ?? [];
  const en = trs.find((t) => t.locale === "en") ?? trs[0];
  for (const k of ["name", "title", "label", "question", "altText"]) {
    const v = en?.[k] ?? snapshot[k];
    if (typeof v === "string" && v.trim()) return v.slice(0, 160);
  }
  for (const k of ["appName", "key", "fromPath", "email", "originalName", "personName", "tradeDate"]) {
    const v = snapshot[k];
    if (typeof v === "string" && v.trim()) return v.slice(0, 160);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  return "";
}

/** The record and what belongs to it, as stored now; null when it does not exist. */
export async function readSnapshot(client: PrismaClient, model: string, where: unknown): Promise<Record<string, unknown> | null> {
  const delegate = (client as unknown as Record<string, { findUnique: (a: unknown) => Promise<unknown> }>)[delegateName(model)];
  if (!delegate) return null;
  const rels = ownedLists(model) ?? [];
  const row = await delegate.findUnique({ where, ...(rels.length && { include: includeFor(rels) }) }).catch(() => null);
  return (row as Record<string, unknown> | null) ?? null;
}

/* The same record is copied once per save, not once per table the save touches. */
const recent = new Map<string, number>();
const SAME_SAVE_MS = 4000;

export async function recordRevision(
  client: PrismaClient,
  model: string,
  snapshot: Record<string, unknown>,
  action: "update" | "delete" | "restore",
  actorId: string,
) {
  const idName = idField(model);
  const entityId = idName ? String(snapshot[idName]) : "";
  if (!entityId) return;
  const k = `${actorId}:${model}:${entityId}:${action}`;
  const now = Date.now();
  if (action === "update" && now - (recent.get(k) ?? 0) < SAME_SAVE_MS) return;
  recent.set(k, now);
  if (recent.size > 500) for (const [key, at] of recent) if (now - at > SAME_SAVE_MS) recent.delete(key);
  const json = JSON.parse(JSON.stringify(snapshot, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
  await (client as unknown as { revision: { create: (a: unknown) => Promise<unknown> } }).revision.create({
    data: { model, entityId, action, label: labelOf(snapshot) || null, snapshot: json, actorId },
  });
}
