"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { encryptFor, hasServerSecret } from "@/lib/auth/totp";
import { ALERT_KEYS, MAIL_KEY, alertRecipients, getMailConfig, storedMail, type StoredMail } from "@/lib/mail/config";
import { sendMail } from "@/lib/mail/smtp";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type NotifyState = { errors?: FieldErrors; message?: string; savedAt?: number };

function parseEmails(text: string): { value: string[] } | { error: string } {
  const list = text
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const bad = list.find((e) => !z.string().email().safeParse(e).success);
  if (bad) return { error: `"${bad}" is not a valid email.` };
  if (list.length > 30) return { error: "At most 30 addresses." };
  return { value: [...new Set(list)] };
}

const schema = z.object({
  host: z.string().trim().max(200),
  port: z.coerce.number().int().min(1).max(65535),
  security: z.enum(["starttls", "tls"]),
  user: z.string().trim().max(200),
  password: z.string().max(500),
  clearPassword: z.string().optional(),
  from: z.string().trim().max(200),
  leadEmails: z.string().max(3000),
  careerEmails: z.string().max(3000),
});

/** Saves the mail server and who is emailed about leads and job applications. */
export async function saveNotifications(_prev: NotifyState, formData: FormData): Promise<NotifyState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(Object.keys(schema.shape).map((k) => [k, formData.get(k) ?? ""])));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  const leads = parseEmails(v.leadEmails);
  if ("error" in leads) return { errors: { leadEmails: leads.error }, message: "Please fix the highlighted fields." };
  const careers = parseEmails(v.careerEmails);
  if ("error" in careers) return { errors: { careerEmails: careers.error }, message: "Please fix the highlighted fields." };
  if (v.host && !/^[a-z0-9.-]+$/i.test(v.host)) return { errors: { host: "Enter a server name such as smtp.office365.com." }, message: "Please fix the highlighted fields." };
  if (v.host && !/<[^@\s]+@[^@\s]+\.[^@\s>]+>$|^[^@\s<]+@[^@\s]+\.[^@\s]+$/.test(v.from))
    return { errors: { from: 'Enter the sender, e.g. Xpert Fintech <no-reply@xpertfintech.com>.' }, message: "Please fix the highlighted fields." };
  if (v.password && !hasServerSecret()) return { errors: { password: "Set SESSION_SECRET (32+ characters) on the server first, so the password can be stored encrypted." } };

  const before = await storedMail();
  const passwordEnc = v.clearPassword ? null : v.password ? encryptFor("mail", v.password) : (before?.passwordEnc ?? null);
  const mail: StoredMail | null = v.host ? { host: v.host, port: v.port, security: v.security, user: v.user, passwordEnc, from: v.from } : null;

  await db.$transaction(async (tx) => {
    const put = (key: string, value: object) =>
      tx.siteSetting.upsert({ where: { key }, update: { value, updatedById: admin.id }, create: { key, value, updatedById: admin.id } });
    if (mail) await put(MAIL_KEY, mail);
    else await tx.siteSetting.deleteMany({ where: { key: MAIL_KEY } });
    await put(ALERT_KEYS.leads, leads.value);
    await put(ALERT_KEYS.careers, careers.value);
  });
  revalidatePath("/admin/notifications");
  return { message: "Saved. New demo requests, contact messages and job applications are emailed as they arrive.", savedAt: Date.now() };
}

/** Sends a test email to the leads list (or the address typed in), with the saved mail server. */
export async function sendTestEmail(_prev: NotifyState, formData: FormData): Promise<NotifyState> {
  const admin = await requireAdmin();
  const typed = String(formData.get("testTo") ?? "").trim().toLowerCase();
  if (typed && !z.string().email().safeParse(typed).success) return { errors: { testTo: "Enter a valid email address." } };
  const to = typed ? [typed] : await alertRecipients("leads");
  if (!to.length) return { errors: { testTo: "Add an address here, or save at least one address under Demo requests and contact messages." } };
  const cfg = await getMailConfig();
  if (!cfg) return { errors: { testTo: "Save the mail server first." } };
  try {
    await sendMail({
      to,
      subject: "Test email from the Xpert Fintech website",
      text: `This is a test sent by ${admin.name} from Admin → Email & notifications.\n\nIf you can read it, new demo requests, contact messages and job applications will reach this inbox.\n\nMail server: ${cfg.host}:${cfg.port} (${cfg.source === "admin" ? "set in the admin" : "from the server's .env"})`,
    });
    return { message: `Test email sent to ${to.join(", ")}. Check the inbox (and the spam folder).`, savedAt: Date.now() };
  } catch (error) {
    return { errors: { testTo: `Could not send: ${(error as Error)?.message ?? error}` } };
  }
}
