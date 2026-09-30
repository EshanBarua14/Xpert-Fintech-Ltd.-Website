import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { offeringOptions } from "@/lib/admin/options";
import { toLocalInput } from "@/lib/validation/common";
import {
  ACTIVITY_LABELS,
  BUSINESS_TYPE_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
} from "@/lib/validation/lead";
import { ConfirmButton } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { LeadActivityForm, LeadDetailsForm, LeadPipelineForm } from "@/components/admin/LeadForms";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { deleteLeadActivity, deleteLeadForever, restoreLead, trashLead } from "../actions";

type Search = { saved?: string; restored?: string };

const CONTACT_LABELS = { ANY: "Any", EMAIL: "Email", PHONE: "Phone call", WHATSAPP: "WhatsApp" } as const;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="text-sm break-words whitespace-pre-line">{children}</dd>
    </div>
  );
}

export default async function LeadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Search> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const flags = await searchParams;

  const [lead, owners, offerings] = await Promise.all([
    db.lead.findUnique({
      where: { id },
      include: {
        interestedOffering: { select: { id: true, translations: { where: { locale: "en" }, select: { name: true } } } },
        activities: { orderBy: { createdAt: "desc" } },
      },
    }),
    db.adminUser.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    offeringOptions(),
  ]);
  if (!lead) notFound();

  // Names of the admins who wrote each history entry.
  const authorIds = [...new Set(lead.activities.map((a) => a.createdById).filter((v): v is string => !!v))];
  const authors = new Map(
    (await db.adminUser.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } })).map((a) => [a.id, a.name]),
  );

  const utm = lead.utm && typeof lead.utm === "object" && !Array.isArray(lead.utm) ? (lead.utm as Record<string, unknown>) : null;
  const inTrash = Boolean(lead.deletedAt);
  const tel = lead.phone ? lead.phone.replace(/[^\d+]/g, "") : null;
  const whatsapp = tel ? tel.replace(/^\+/, "") : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/leads" className="text-sm text-text-secondary hover:text-brand-sky">
            ← Leads
          </Link>
          <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
            {lead.name}
            <Badge tone={lead.status === "NEW" ? "brand" : lead.status === "WON" ? "up" : lead.status === "LOST" ? "down" : "neutral"}>
              {STATUS_LABELS[lead.status]}
            </Badge>
            {inTrash && <Badge tone="down">In trash</Badge>}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {SOURCE_LABELS[lead.source]} · received {formatDhaka(lead.createdAt)}
            {lead.organization ? ` · ${lead.organization}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`mailto:${lead.email}`} className={buttonClasses({ size: "sm" })}>
            Email
          </a>
          {tel && (
            <a href={`tel:${tel}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
              Call
            </a>
          )}
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "secondary", size: "sm" })}>
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {flags.saved && <Notice tone="success">Lead added.</Notice>}
      {flags.restored && <Notice>Restored from the trash.</Notice>}

      <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-8">
          <section className="rounded-card border border-white/10 p-6">
            <h2 className="font-display text-lg font-semibold">Enquiry</h2>
            <dl className="mt-2 divide-y divide-white/10">
              <Row label="Email">
                <a href={`mailto:${lead.email}`} className="text-brand-sky hover:underline">
                  {lead.email}
                </a>
              </Row>
              <Row label="Phone">{lead.phone ?? "—"}</Row>
              <Row label="Organization">{lead.organization ?? "—"}</Row>
              <Row label="Designation">{lead.designation ?? "—"}</Row>
              <Row label="Type of organization">
                {lead.businessType ? (BUSINESS_TYPE_LABELS[lead.businessType as keyof typeof BUSINESS_TYPE_LABELS] ?? lead.businessType) : "—"}
              </Row>
              <Row label="Product of interest">
                {lead.interestedOffering ? (
                  <Link href={`/admin/products/${lead.interestedOffering.id}`} className="text-brand-sky hover:underline">
                    {lead.interestedOffering.translations[0]?.name ?? "(untitled)"}
                  </Link>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="Requirement">{lead.expectedRequirement ?? "—"}</Row>
              <Row label="Message">{lead.message ?? "—"}</Row>
              <Row label="Preferred contact">{CONTACT_LABELS[lead.preferredContact]}</Row>
              <Row label="Language">{lead.locale === "bn" ? "বাংলা" : "English"}</Row>
              <Row label="Consent">{lead.consent ? `Given ${formatDhaka(lead.consentAt)}` : lead.source === "MANUAL" ? "Added by admin" : "No"}</Row>
              {lead.pageUrl && <Row label="Sent from page">{lead.pageUrl}</Row>}
              {utm && Object.keys(utm).length > 0 && (
                <Row label="Campaign (UTM)">
                  {Object.entries(utm)
                    .map(([k, v]) => `${k.replace("utm_", "")}: ${String(v)}`)
                    .join("\n")}
                </Row>
              )}
            </dl>
          </section>

          <section className="flex flex-col gap-4 rounded-card border border-white/10 p-6">
            <h2 className="font-display text-lg font-semibold">History</h2>
            {!inTrash && <LeadActivityForm leadId={lead.id} />}
            <ol className="flex flex-col divide-y divide-white/10 border-t border-white/10">
              {lead.activities.length === 0 && <li className="py-4 text-sm text-text-secondary">Nothing logged yet.</li>}
              {lead.activities.map((a) => (
                <li key={a.id} className="flex flex-col gap-1 py-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                    <Badge>{ACTIVITY_LABELS[a.kind]}</Badge>
                    <span>{formatDhaka(a.createdAt)}</span>
                    {a.createdById && <span>· {authors.get(a.createdById) ?? "Former admin"}</span>}
                    {a.kind !== "STATUS_CHANGE" && !inTrash && (
                      <form action={deleteLeadActivity} className="ml-auto">
                        <input type="hidden" name="id" value={a.id} />
                        <ConfirmButton message="Remove this entry from the history?" className="text-xs text-text-secondary hover:text-market-down">
                          Remove
                        </ConfirmButton>
                      </form>
                    )}
                  </div>
                  {a.body && <p className="text-sm whitespace-pre-line">{a.body}</p>}
                </li>
              ))}
            </ol>
          </section>

          {!inTrash && (
            <details className="rounded-card border border-white/10 p-6">
              <summary className="cursor-pointer font-display text-lg font-semibold">Edit contact details</summary>
              <div className="mt-6">
                <LeadDetailsForm
                  offerings={offerings}
                  values={{
                    id: lead.id,
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone ?? "",
                    organization: lead.organization ?? "",
                    designation: lead.designation ?? "",
                    businessType: lead.businessType ?? "",
                    interestedOfferingId: lead.interestedOfferingId ?? "",
                    expectedRequirement: lead.expectedRequirement ?? "",
                    message: lead.message ?? "",
                    preferredContact: lead.preferredContact,
                  }}
                />
              </div>
            </details>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          {!inTrash && (
            <section className="rounded-card border border-white/10 p-6">
              <h2 className="mb-4 font-display text-lg font-semibold">Follow-up</h2>
              <LeadPipelineForm
                id={lead.id}
                status={lead.status}
                ownerId={lead.ownerId ?? ""}
                followUpAt={toLocalInput(lead.followUpAt)}
                owners={owners.map((o) => ({ value: o.id, label: o.name }))}
              />
            </section>
          )}

          <section className="flex flex-col gap-3 rounded-card border border-white/10 p-6 text-sm">
            <h2 className="font-display text-lg font-semibold">Technical details</h2>
            <p className="text-text-secondary">Kept for spam checks. Remove the lead permanently if the person asks for their data to be deleted.</p>
            <dl className="flex flex-col gap-2 text-xs">
              <div>
                <dt className="text-text-secondary">IP address</dt>
                <dd className="tabular">{lead.ip ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Browser</dt>
                <dd className="break-words">{lead.userAgent ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Last updated</dt>
                <dd>{formatDhaka(lead.updatedAt)}</dd>
              </div>
            </dl>
          </section>

          {inTrash ? (
            <section className="flex flex-col gap-3 rounded-card border border-market-down/30 p-6">
              <p className="text-sm">This lead is in the trash.</p>
              <div className="flex flex-wrap gap-3">
                <form action={restoreLead}>
                  <input type="hidden" name="id" value={lead.id} />
                  <button type="submit" className={buttonClasses({ size: "sm" })}>
                    Restore
                  </button>
                </form>
                <form action={deleteLeadForever}>
                  <input type="hidden" name="id" value={lead.id} />
                  <ConfirmButton message="Delete this lead and its history permanently? This cannot be undone.">Delete permanently</ConfirmButton>
                </form>
              </div>
            </section>
          ) : (
            <form action={trashLead}>
              <input type="hidden" name="id" value={lead.id} />
              <ConfirmButton message="Move this lead to the trash?">Move to trash</ConfirmButton>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
