import "server-only";
import { db } from "@/lib/db/client";
import { decryptFor } from "@/lib/auth/totp";

/**
 * Where notification emails go out from and to. Set in Admin → Email &
 * notifications (stored in the database, the password encrypted with
 * SESSION_SECRET); the server's .env (SMTP_*, MAIL_FROM, LEAD_ALERT_EMAILS)
 * is used when nothing is set there.
 */
export const MAIL_KEY = "mail.smtp";
export const ALERT_KEYS = { leads: "leads.alertEmails", careers: "careers.alertEmails" } as const;

export type StoredMail = { host: string; port: number; security: "starttls" | "tls"; user: string; passwordEnc: string | null; from: string };
export type MailConfig = {
  host: string;
  port: number;
  implicitTls: boolean;
  user: string;
  pass: string;
  from: string;
  rejectUnauthorized: boolean;
  source: "admin" | "env";
};

export async function storedMail(): Promise<StoredMail | null> {
  const row = await db.siteSetting.findUnique({ where: { key: MAIL_KEY } }).catch(() => null);
  const v = row?.value as Partial<StoredMail> | undefined;
  return v && typeof v.host === "string" && v.host ? (v as StoredMail) : null;
}

export async function getMailConfig(): Promise<MailConfig | null> {
  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false";
  const s = await storedMail();
  if (s?.host && s.from) {
    return {
      host: s.host,
      port: Number(s.port) || 587,
      implicitTls: s.security === "tls" || Number(s.port) === 465,
      user: s.user ?? "",
      pass: decryptFor("mail", s.passwordEnc) ?? "",
      from: s.from,
      rejectUnauthorized,
      source: "admin",
    };
  }
  const host = process.env.SMTP_HOST;
  const from = process.env.MAIL_FROM;
  if (!host || !from) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  return {
    host,
    port,
    implicitTls: process.env.SMTP_SECURE === "true" || port === 465,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
    from,
    rejectUnauthorized,
    source: "env",
  };
}

const valid = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

/**
 * Who is emailed about each kind of message. Job applications use their own
 * list when one is set, otherwise the leads list; the leads list falls back to
 * LEAD_ALERT_EMAILS in .env.
 */
export async function alertRecipients(kind: keyof typeof ALERT_KEYS): Promise<string[]> {
  const read = async (key: string) => {
    const row = await db.siteSetting.findUnique({ where: { key } }).catch(() => null);
    const raw: unknown = row?.value;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  };
  let list = await read(ALERT_KEYS[kind]);
  if (!list.length && kind === "careers") list = await read(ALERT_KEYS.leads);
  if (!list.length) list = (process.env.LEAD_ALERT_EMAILS ?? "").split(/[,\s]+/).filter(Boolean);
  return [...new Set(list.map((e) => e.trim().toLowerCase()))].filter(valid);
}
