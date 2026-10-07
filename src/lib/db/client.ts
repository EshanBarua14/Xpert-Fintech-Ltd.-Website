import { PrismaClient, type Prisma } from "@prisma/client";

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

const SKIP = new Set(["AuditLog", "Session", "PasswordReset", "MediaUsage", "EventMedia", "AlbumMedia", "ArticleTag", "EventOrganization", "EcosystemFlowStep"]);
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

function createClient() {
  const base = new PrismaClient({
    log: process.env.APP_ENV === "development" ? ["warn", "error"] : ["error"],
  });
  const extended = base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const result = await query(args);
          if (!WRITES.has(operation) || SKIP.has(model) || model.endsWith("Translation") || model === "LeadActivity") return result;
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
