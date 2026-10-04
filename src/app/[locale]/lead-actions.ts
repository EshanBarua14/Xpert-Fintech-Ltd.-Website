"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import { requestMeta } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { verifyTurnstile } from "@/lib/public/turnstile";
import { notifyNewLead } from "@/lib/leads/notify";
import { publicLeadSchema, type LeadFormState } from "@/lib/validation/lead";

const MIN_FILL_MS = 2500; // humans take longer than this to fill in a form
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const FIELDS = [
  "name",
  "email",
  "phone",
  "organization",
  "designation",
  "businessType",
  "interestedOfferingId",
  "expectedRequirement",
  "message",
  "preferredContact",
  "consent",
] as const;

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

/**
 * Public demo-request and contact forms. Spam defences, in order:
 * honeypot field, minimum fill time, validation, per-IP rate limit, optional Turnstile.
 * Suspected bots get a normal "thank you" so they learn nothing.
 */
export async function submitLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const mode = str(formData.get("mode")) === "contact" ? "contact" : "demo";
  const locale = str(formData.get("locale")) === "bn" ? "bn" : "en";
  const { ip, userAgent } = await requestMeta();

  // 1. Honeypot: hidden from people, often filled by bots.
  if (str(formData.get("company_website"))) return { status: "success" };

  // 2. Too fast to be a person.
  const startedAt = Number(str(formData.get("started_at")));
  if (!Number.isFinite(startedAt) || startedAt <= 0 || Date.now() - startedAt < MIN_FILL_MS) {
    return { status: "success" };
  }

  // 3. Validate (mistakes here do not count towards the rate limit).
  const input = Object.fromEntries(FIELDS.map((k) => [k, str(formData.get(k))]));
  const parsed = publicLeadSchema(mode).safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { status: "error", errors, message: "fix" };
  }
  const v = parsed.data;

  // 4. Rate limit: 5 valid submissions per IP per hour.
  if (!rateLimit(`lead:${ip ?? "unknown"}`, 5, 60 * 60 * 1000).ok) return { status: "error", message: "rateLimited" };

  // 5. Turnstile (only when configured).
  if (!(await verifyTurnstile(str(formData.get("cf-turnstile-response")) || null, ip))) {
    return { status: "error", message: "captcha" };
  }

  try {
    // Only accept a product that is actually on the website.
    const offeringId = v.interestedOfferingId
      ? ((await db.offering.findFirst({ where: { id: v.interestedOfferingId, ...publishedWhere() }, select: { id: true } }))?.id ?? null)
      : null;

    // Demo form extras: other products of interest and a preferred time, kept
    // with the requirement text so the sales team sees them in one place.
    let requirement = v.expectedRequirement ?? null;
    if (mode === "demo") {
      const also = formData
        .getAll("alsoInterested")
        .map(String)
        .filter((id) => /^[0-9a-f-]{36}$/.test(id) && id !== offeringId)
        .slice(0, 10);
      const names = also.length
        ? (await db.offering.findMany({ where: { id: { in: also }, ...publishedWhere() }, include: { translations: { where: { locale: "en" } } } }))
            .map((o) => o.translations[0]?.name)
            .filter((x): x is string => Boolean(x))
        : [];
      const TIMES: Record<string, string> = { morning: "Morning (10:00–13:00 Dhaka)", afternoon: "Afternoon (13:00–17:00 Dhaka)", evening: "Evening (17:00–20:00 Dhaka)" };
      const time = TIMES[str(formData.get("preferredTime"))];
      const extra = [names.length ? `Also interested in: ${names.join(", ")}` : null, time ? `Preferred time for a call: ${time}` : null].filter(Boolean).join("\n");
      if (extra) requirement = [requirement, extra].filter(Boolean).join("\n\n").slice(0, 3000);
    }

    // Double-click / resubmit guard: same person and form within 10 minutes.
    const recent = await db.lead.findFirst({
      where: {
        email: v.email,
        source: mode === "demo" ? "DEMO_REQUEST" : "CONTACT_FORM",
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (recent) return { status: "success" };

    const utm: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = str(formData.get(key)).trim().slice(0, 200);
      if (value) utm[key] = value;
    }
    const pageUrl = str(formData.get("page_path")).slice(0, 500);

    const lead = await db.lead.create({
      data: {
        source: mode === "demo" ? "DEMO_REQUEST" : "CONTACT_FORM",
        name: v.name,
        email: v.email,
        phone: v.phone,
        organization: v.organization,
        designation: v.designation,
        businessType: v.businessType,
        interestedOfferingId: offeringId,
        expectedRequirement: requirement,
        message: v.message,
        preferredContact: v.preferredContact,
        consent: true,
        consentAt: new Date(),
        locale,
        pageUrl: pageUrl.startsWith("/") ? pageUrl : null,
        utm: Object.keys(utm).length ? utm : undefined,
        ip,
        userAgent,
      },
      select: { id: true },
    });
    // Email the sales team after the visitor has their answer (retries in the background).
    after(() => notifyNewLead(lead.id));
  } catch (error) {
    console.error("[leads] could not save enquiry", error);
    return { status: "error", message: "generic" };
  }

  revalidatePath("/admin", "layout");
  return { status: "success" };
}
