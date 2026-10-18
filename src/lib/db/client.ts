import { PrismaClient, type Prisma } from "@prisma/client";
import { idField, isQuiet, isTracked, readSnapshot, recordRevision, translationOwner } from "./revision-capture";

/*
 * One PrismaClient per server process. In development, Next.js hot reload
 * re-evaluates modules, so the instance is cached on globalThis.
 *
 * Audit log: every create, update and delete an admin makes is recorded in
 * AuditLog (who, what, which record, which fields, when, from where), here in
 * one place so no admin action can forget to log. Visitors' own submissions
 * (leads, job applications) and housekeeping tables are not logged. Logging
 * never blocks or breaks the change itself.
 */

const SKIP = new Set(["AuditLog", "Revision", "StoredFile", "Session", "PasswordReset", "MediaUsage", "EventMedia", "AlbumMedia", "ArticleTag", "EventOrganization", "EcosystemFlowStep"]);
const WRITES = new Set(["create", "createMany", "update", "updateMany", "upsert", "delete", "deleteMany"]);
/** Values worth keeping in the log; other fields are recorded by name only. */
const KEEP_VALUES = new Set(["status", "deletedAt", "isActive", "isFeatured", "isClosed", "isPlayback", "publishAt", "kind", "key", "role", "logoPermission"]);
const ENTITY: Record<string, string> = {
  Page: "PAGE",
  Offering: "OFFERING",
  Organization: "ORGANIZATION",
  Deployment: "DEPLOYMENT",
  CaseStudy: "CASE_STUDY",
  Person: "PERSON",
  Career: "CAREER",
  Article: "ARTICLE",
  Event: "EVENT",
  Resource: "RESOURCE",
  Album: "ALBUM",
  Video: "VIDEO",
  Testimonial: "TESTIMONIAL",
};

function summarize(data: unknown): Record<string, unknown> | undefined {
  if (!data || typeof data !== "object" || Array.isArray(data)) return undefined;
  const fields = Object.keys(data as object);
  const values: Record<string, unknown> = {};
  for (const k of fields) {
    if (!KEEP_VALUES.has(k)) continue;
    const v = (data as Record<string, unknown>)[k];
    values[k] = v instanceof Date ? v.toISOString() : typeof v === "object" ? null : v;
  }
  return { fields, ...(Object.keys(values).length && { values }) };
}

/**
 * A where written for a unique lookup can use a compound key ({ articleId_locale:
 * { articleId, locale } }), which findMany does not accept: spread such keys
 * into their fields ({ articleId, locale }) so the same record is found.
 */
function flattenWhere(where: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!where) return where;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(where)) {
    if (k.includes("_") && v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) Object.assign(out, v);
    else out[k] = v;
  }
  return out;
}

const REVISION_OPS = new Set(["update", "upsert", "delete", "updateMany", "deleteMany"]);

/** Copies the current state of what an admin is about to change into Revision. Never blocks the change. */
async function keepRevision(base: PrismaClient, model: string, operation: string, args: unknown) {
  if (isQuiet()) return;
  try {
    const translation = translationOwner(model);
    const target = translation?.model ?? model;
    if (!isTracked(target)) return;
    const where = (args as { where?: Record<string, unknown> } | undefined)?.where;
    // The site's own bookkeeping (shared market board, recorded turnover) is not an admin change.
    if (target === "SiteSetting" && /^market\.(board|turnover\.)/.test(String(where?.key ?? ""))) return;
    const { getCurrentAdmin } = await import("@/lib/auth/session");
    const admin = await getCurrentAdmin().catch(() => null);
    if (!admin) return;
    const a = (args ?? {}) as { where?: Record<string, unknown>; create?: Record<string, unknown>; data?: Record<string, unknown> };
    const action = operation.startsWith("delete") && !translation ? "delete" : "update";
    const delegate = (m: string) => (base as unknown as Record<string, { findMany: (x: unknown) => Promise<Record<string, unknown>[]> }>)[m.charAt(0).toLowerCase() + m.slice(1)]!;
    // The records concerned: by the where of the change (a translation: the record it translates).
    let ids: unknown[] = [];
    if (translation) {
      // A new translation names its record in the data; otherwise the where says which.
      const rows = operation === "create" || !a.where ? [] : await delegate(model).findMany({ where: flattenWhere(a.where), select: { [translation.fk]: true }, take: 50 }).catch(() => []);
      ids = rows.map((r) => r[translation.fk]);
      const fromCreate = a.create?.[translation.fk] ?? a.data?.[translation.fk];
      if (fromCreate) ids.push(fromCreate);
    } else if (operation === "updateMany" || operation === "deleteMany") {
      const rows = await delegate(model).findMany({ where: flattenWhere(a.where) ?? {}, take: 50 }).catch(() => []);
      const idName = idField(target) ?? "id";
      ids = rows.map((r) => r[idName]);
    } else {
      const snap = await readSnapshot(base, target, a.where);
      if (snap) await recordRevision(base, target, snap, action, admin.id);
      return;
    }
    for (const id of new Set(ids.filter(Boolean).map(String))) {
      const snap = await readSnapshot(base, target, { [idField(target) ?? "id"]: id });
      if (snap) await recordRevision(base, target, snap, action, admin.id);
    }
  } catch (error) {
    console.error("[revisions] could not keep a copy", model, operation, (error as Error)?.message ?? error);
  }
}

/** Records that an admin added an item (Undo removes it again). Never blocks the change. */
async function keepCreation(base: PrismaClient, model: string, result: unknown) {
  if (isQuiet() || !isTracked(model)) return;
  try {
    const { getCurrentAdmin } = await import("@/lib/auth/session");
    const admin = await getCurrentAdmin().catch(() => null);
    if (!admin || !result || typeof result !== "object") return;
    await recordRevision(base, model, result as Record<string, unknown>, "create", admin.id);
  } catch (error) {
    console.error("[revisions] could not note a new item", model, (error as Error)?.message ?? error);
  }
}

function createClient() {
  const base = new PrismaClient({
    log: process.env.APP_ENV === "development" ? ["warn", "error"] : ["error"],
  });
  const extended = base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Before an admin changes or deletes something, keep a copy so it can be undone (Admin → History).
          if (model && (REVISION_OPS.has(operation) || (operation === "create" && translationOwner(model)))) await keepRevision(base, model, operation, args);
          const result = await query(args);
          // A new item: noted so Undo can take it away again (and Redo bring it back).
          if (model && operation === "create" && !translationOwner(model)) await keepCreation(base, model, result);
          if (!WRITES.has(operation) || SKIP.has(model) || model.endsWith("Translation") || model === "LeadActivity") return result;
          // The site's own bookkeeping (shared market board, recorded turnover) is not an admin change.
          if (model === "SiteSetting" && /^market\.(board|turnover\.)/.test(String((args as { where?: { key?: unknown } }).where?.key ?? ""))) return result;
          try {
            // Only inside a signed-in admin's request (scripts and visitors have no session).
            const { getCurrentAdmin, requestMeta } = await import("@/lib/auth/session");
            const admin = await getCurrentAdmin().catch(() => null);
            if (!admin) return result;
            const meta = await requestMeta().catch(() => ({ ip: null, userAgent: null }));
            const a = args as { where?: { id?: unknown }; data?: unknown; create?: unknown; update?: unknown };
            const r = result as { id?: unknown; count?: number } | null;
            const entityId = typeof r?.id === "string" ? r.id : typeof a.where?.id === "string" ? a.where.id : null;
            const data = operation === "upsert" ? (entityId && a.update ? a.update : a.create) : a.data;
            const changes = { ...summarize(Array.isArray(data) ? data[0] : data), ...(typeof r?.count === "number" && { count: r.count }) };
            await base.auditLog.create({
              data: {
                actorId: admin.id,
                action: `${model}.${operation}`,
                entityType: (ENTITY[model] ?? null) as Prisma.AuditLogCreateInput["entityType"],
                entityId,
                changes: Object.keys(changes).length ? (changes as Prisma.InputJsonValue) : undefined,
                ip: meta.ip,
                userAgent: meta.userAgent?.slice(0, 300) ?? null,
              },
            });
          } catch (error) {
            console.error("[audit] could not record", model, operation, (error as Error)?.message ?? error);
          }
          return result;
        },
      },
    },
  });
  // Same API as PrismaClient; typed as such so transaction clients stay compatible.
  return extended as unknown as PrismaClient;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
