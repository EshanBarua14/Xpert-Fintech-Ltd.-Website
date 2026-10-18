import "server-only";
import { db } from "@/lib/db/client";
import { alertRecipients } from "@/lib/mail/config";
import { mailConfigured, sendMailWithRetry } from "@/lib/mail/smtp";

/**
 * Emails the team about a new job application (Admin → Email & notifications →
 * "Job applications"). The CV stays private in the admin: the email links to
 * the application instead of attaching it. Retries on failure; problems are
 * logged and never shown to the applicant.
 */
export async function notifyNewApplication(applicationId: string): Promise<void> {
  if (!(await mailConfigured())) return;
  const to = await alertRecipients("careers");
  if (!to.length) return;
  const a = await db.careerApplication.findUnique({
    where: { id: applicationId },
    include: { career: { include: { translations: { where: { locale: "en" } } } } },
  });
  if (!a) return;
  const role = a.career.translations[0]?.title ?? "a role";
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const letter = a.coverLetter?.trim();
  const lines = [
    `New job application from the website: ${role}.`,
    "",
    `Name:   ${a.name}`,
    `Email:  ${a.email}`,
    a.phone ? `Phone:  ${a.phone}` : null,
    `CV:     ${a.cvMediaId ? "attached in the admin (private)" : "none"}`,
    "",
    letter ? `Cover letter:\n${letter.length > 2000 ? `${letter.slice(0, 2000)}…` : letter}` : null,
    "",
    site ? `Open in the admin: ${site}/admin/applications/${a.id}` : `Application id: ${a.id}`,
    `Received ${a.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" })} (Dhaka)`,
  ].filter((l): l is string => l !== null);
  await sendMailWithRetry({ to, subject: `Job application: ${role} (${a.name})`.slice(0, 150), text: lines.join("\n"), replyTo: `${a.name} <${a.email}>` }, `application ${a.id}`);
}
