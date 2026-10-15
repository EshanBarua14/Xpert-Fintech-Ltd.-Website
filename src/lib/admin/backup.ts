import "server-only";
import { gunzipSync, gzipSync } from "node:zlib";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { delegateName, models, quietly } from "@/lib/db/revision-capture";

/*
 * Backups: a full copy of the site's content — every table except sign-ins,
 * passwords, logs, change history and the bytes of uploaded files (those stay
 * where they are; the copy keeps every file's record) — as gzip-compressed
 * JSON in the Backup table. One is made automatically each day (Vercel's
 * scheduled job, and as a fallback the first admin visit after 24 hours), one
 * on demand, and one just before any restore, so a restore can be undone.
 */

const EXCLUDED = new Set(["AdminUser", "Session", "PasswordReset", "AuditLog", "Revision", "StoredFile", "Backup"]);
const KEEP = { auto: 14, manual: 30, "before-restore": 10 } as const;
type Kind = keyof typeof KEEP;

type DField = { name: string; kind: string; type: string; isList: boolean; relationFromFields?: readonly string[] };
type DModel = { name: string; fields: readonly DField[] };

function tables(): DModel[] {
  return [...models().values()].filter((m) => !EXCLUDED.has(m.name)) as unknown as DModel[];
}

type Delegate = {
  findMany: (a?: unknown) => Promise<Record<string, unknown>[]>;
  deleteMany: (a?: unknown) => Promise<unknown>;
  createMany: (a: unknown) => Promise<unknown>;
};
const delegate = (client: unknown, model: string) => (client as Record<string, Delegate>)[delegateName(model)]!;

/** Tables in an order where every table comes after the tables it points to. */
function insertOrder(list: DModel[]): DModel[] {
  const names = new Set(list.map((m) => m.name));
  const deps = new Map(
    list.map((m) => [
      m.name,
      new Set(m.fields.filter((f) => f.kind === "object" && (f.relationFromFields?.length ?? 0) > 0 && names.has(f.type) && f.type !== m.name).map((f) => f.type)),
    ]),
  );
  const out: DModel[] = [];
  const done = new Set<string>();
  const visit = (m: DModel, seen = new Set<string>()) => {
    if (done.has(m.name) || seen.has(m.name)) return;
    seen.add(m.name);
    for (const d of deps.get(m.name) ?? []) visit(list.find((x) => x.name === d)!, seen);
    done.add(m.name);
    out.push(m);
  };
  for (const m of list) visit(m);
  return out;
}

const encode = (_k: string, v: unknown) => {
  if (typeof v === "bigint") return { $big: v.toString() };
  if (v && typeof v === "object" && (v as { type?: string }).type === "Buffer" && Array.isArray((v as { data?: unknown }).data)) {
    return { $bytes: Buffer.from((v as { data: number[] }).data).toString("base64") };
  }
  return v;
};

export type BackupFile = { format: "xpert-backup"; version: 1; createdAt: string; tables: Record<string, Record<string, unknown>[]> };

/** Reads every content table into one object. */
export async function snapshotContent(): Promise<BackupFile> {
  const out: BackupFile = { format: "xpert-backup", version: 1, createdAt: new Date().toISOString(), tables: {} };
  for (const m of tables()) {
    const d = delegate(db, m.name);
    if (!d?.findMany) continue;
    out.tables[m.name] = await d.findMany();
  }
  return out;
}

function pack(file: BackupFile): Buffer {
  return gzipSync(Buffer.from(JSON.stringify(file, encode)));
}

export function unpack(data: Uint8Array): BackupFile {
  const file = JSON.parse(gunzipSync(Buffer.from(data)).toString("utf8")) as BackupFile;
  if (file?.format !== "xpert-backup" || !file.tables) throw new Error("This is not an Xpert website backup.");
  return file;
}

/** Makes a backup now and keeps only the most recent ones of its kind. */
export async function createBackup(kind: Kind, actorId: string | null = null, note: string | null = null) {
  const file = await snapshotContent();
  const data = pack(file);
  const counts = Object.fromEntries(Object.entries(file.tables).map(([k, v]) => [k, v.length]));
  const row = await db.backup.create({ data: { kind, sizeBytes: data.length, counts, data: new Uint8Array(data), actorId, note }, select: { id: true, createdAt: true, sizeBytes: true } });
  const old = await db.backup.findMany({ where: { kind }, orderBy: { createdAt: "desc" }, skip: KEEP[kind], select: { id: true } });
  if (old.length) await db.backup.deleteMany({ where: { id: { in: old.map((b) => b.id) } } });
  return row;
}

let checking = false;
/** The daily automatic backup, if the last one is more than 23 hours old. Never throws. */
export async function backupIfDue() {
  if (checking) return;
  checking = true;
  try {
    const last = await db.backup.findFirst({ where: { kind: "auto" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
    if (!last || Date.now() - last.createdAt.getTime() > 23 * 3600 * 1000) await createBackup("auto");
  } catch (error) {
    console.error("[backup] automatic backup failed", (error as Error)?.message ?? error);
  } finally {
    checking = false;
  }
}

/** Turns a stored row back into what the database expects (dates, bytes, decimals, JSON). */
function revive(m: DModel, row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of m.fields) {
    if (f.kind === "object" || !(f.name in row)) continue;
    const v = row[f.name];
    if (v === null) {
      if (f.type !== "Json") out[f.name] = null; // a missing JSON value takes the column's default
      continue;
    }
    if (f.type === "DateTime") out[f.name] = f.isList ? (v as string[]).map((x) => new Date(x)) : new Date(v as string);
    else if (f.type === "Bytes") out[f.name] = Buffer.from((v as { $bytes: string }).$bytes ?? "", "base64");
    else if (f.type === "BigInt") out[f.name] = BigInt((v as { $big?: string }).$big ?? (v as string));
    else if (f.type === "Decimal") out[f.name] = new Prisma.Decimal(v as string);
    else out[f.name] = v;
  }
  return out;
}

/**
 * Puts the site's content back exactly as it was in a backup. A backup of the
 * current state is made first, so this can be undone by restoring that one.
 * Admin accounts, sign-ins, the change history and uploaded files are not
 * touched.
 */
export async function restoreBackup(file: BackupFile, actorId: string | null) {
  await createBackup("before-restore", actorId, `Made before restoring the backup of ${file.createdAt}`);
  const order = insertOrder(tables()).filter((m) => file.tables[m.name]);
  // Links to admin accounts (e.g. who a lead is assigned to) are kept only if that account still exists.
  const admins = new Set((await db.adminUser.findMany({ select: { id: true } })).map((a) => a.id));
  const adminFks = new Map(
    order.map((m) => [m.name, m.fields.filter((f) => f.kind === "object" && f.type === "AdminUser").flatMap((f) => [...(f.relationFromFields ?? [])])]),
  );
  await quietly(() =>
    db.$transaction(
      async (tx) => {
        for (const m of [...order].reverse()) await delegate(tx, m.name).deleteMany({});
        for (const m of order) {
          const fks = adminFks.get(m.name) ?? [];
          const rows = (file.tables[m.name] ?? []).map((r) => {
            const row = revive(m, r);
            for (const k of fks) if (row[k] && !admins.has(String(row[k]))) row[k] = null;
            return row;
          });
          for (let i = 0; i < rows.length; i += 500) await delegate(tx, m.name).createMany({ data: rows.slice(i, i + 500) });
        }
      },
      { maxWait: 20_000, timeout: 180_000 },
    ),
  );
  return Object.fromEntries(order.map((m) => [m.name, file.tables[m.name]?.length ?? 0]));
}
