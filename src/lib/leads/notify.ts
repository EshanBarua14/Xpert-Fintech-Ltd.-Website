import "server-only";
import { db } from "@/lib/db/client";
import { mailConfigured, sendMailWithRetry } from "@/lib/mail/smtp";

/** Who gets new-lead emails: Admin → Settings → "Send new leads to", else LEAD_ALERT_EMAILS. */
async function recipients(): Promise<string[]> {
  const row = await db.siteSetting.findUnique({ where: { key: "leads.alertEmails" } }).catch(() => null);
  const raw: unknown = row?.value;
  const fromSettings: string[] = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  const fromEnv = (process.env.LEAD_ALERT_EMAILS ?? "").split(/[,\s]+/).filter(Boolean);
  return [...new Set((fromSettings.length ? fromSettings : fromEnv).map((e) => e.trim().toLowerCase()))].filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
}

const SOURCE = { DEMO_REQUEST: "Demo request", CONTACT_FORM: "Contact message" } as Record<string, string>;

/**
 * Emails the sales team about a new lead. The subject names only the kind of
 * enquiry and the organisation — never the visitor's message. Retries on
 * failure; problems are logged and never shown to the visitor.
 */
export async function notifyNewLead(leadId: string): Promise<void> {
  if (!mailConfigured()) return;
  const to = await recipients();
  if (!to.length) return;
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: { interestedOffering: { include: { translations: { where: { locale: "en" } } } } },
  });
  if (!lead) return;
  const kind = SOURCE[lead.source] ?? "New lead";
  const who = lead.organization || lead.name;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const lines = [
    `${kind} from the website.`,
    "",
    `Name:          ${lead.name}`,
    lead.designation ? `Role:          ${lead.designation}` : null,
    lead.organization ? `Organisation:  ${lead.organization}` : null,
    lead.businessType ? `Business type: ${lead.businessType}` : null,
    `Email:         ${lead.email}`,
    lead.phone ? `Phone:         ${lead.phone}` : null,
    `Prefers:       ${lead.preferredContact.toLowerCase()}`,
    lead.interestedOffering ? `Interested in: ${lead.interestedOffering.translations[0]?.name ?? ""}` : null,
    lead.expectedRequirement ? `Timing:        ${lead.expectedRequirement}` : null,
    "",
    lead.message ? `Message:\n${lead.message}` : null,
    "",
    site ? `Open in the admin: ${site}/admin/leads/${lead.id}` : `Lead id: ${lead.id}`,
    `Received ${lead.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" })} (Dhaka)`,
  ].filter((l): l is string => l !== null);
  const sent = await sendMailWithRetry({ to, subject: `${kind}: ${who}`.slice(0, 150), text: lines.join("\n"), replyTo: `${lead.name} <${lead.email}>` }, `lead ${lead.id}`);
  if (sent) {
    await db.leadActivity
      .create({ data: { leadId: lead.id, kind: "EMAIL", body: `New-lead alert emailed to ${to.join(", ")}` } })
      .catch(() => {});
  }
}
