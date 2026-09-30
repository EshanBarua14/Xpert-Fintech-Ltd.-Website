import { z } from "zod";

/**
 * Lead (enquiry) fields, shared by the public forms and the admin portal.
 * Error messages are short codes; each side turns them into words
 * (public forms in the visitor's language, the admin in English).
 */
export type LeadErrorCode = "required" | "email" | "phone" | "tooLong" | "consent";

export const BUSINESS_TYPES = ["brokerage", "merchantBank", "assetManager", "bank", "other"] as const;
export const CONTACT_METHODS = ["ANY", "EMAIL", "PHONE", "WHATSAPP"] as const;
export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "DEMO_SCHEDULED", "PROPOSAL", "WON", "LOST"] as const;
export const LEAD_SOURCES = ["DEMO_REQUEST", "CONTACT_FORM", "MANUAL"] as const;
export const ACTIVITY_KINDS = ["NOTE", "CALL", "EMAIL", "MEETING"] as const;

export const STATUS_LABELS: Record<(typeof LEAD_STATUSES)[number], string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  DEMO_SCHEDULED: "Demo scheduled",
  PROPOSAL: "Proposal sent",
  WON: "Won",
  LOST: "Closed — lost",
};
export const SOURCE_LABELS: Record<(typeof LEAD_SOURCES)[number], string> = {
  DEMO_REQUEST: "Demo request",
  CONTACT_FORM: "Contact form",
  MANUAL: "Added by admin",
};
export const ACTIVITY_LABELS: Record<(typeof ACTIVITY_KINDS)[number] | "STATUS_CHANGE", string> = {
  NOTE: "Note",
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  STATUS_CHANGE: "Status change",
};
export const BUSINESS_TYPE_LABELS: Record<(typeof BUSINESS_TYPES)[number], string> = {
  brokerage: "Brokerage house (TREC holder)",
  merchantBank: "Merchant bank",
  assetManager: "Asset manager",
  bank: "Bank or financial institution",
  other: "Other",
};

const required = (max: number) => z.string().trim().min(1, "required").max(max, "tooLong");
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .transform((v) => (v === "" ? null : v));

const phone = z
  .string()
  .trim()
  .max(30, "tooLong")
  .refine((v) => v === "" || /^\+?[\d\s()-]{6,24}$/.test(v), "phone")
  .transform((v) => (v === "" ? null : v));

/** The fields a visitor (or an admin adding a lead by hand) fills in. */
export const leadFields = z.object({
  name: required(120),
  email: z.string().trim().toLowerCase().min(1, "required").max(200, "tooLong").email("email"),
  phone,
  organization: optional(200),
  designation: optional(120),
  businessType: z
    .enum(["", ...BUSINESS_TYPES] as const)
    .catch("")
    .transform((v) => v || null),
  interestedOfferingId: z
    .string()
    .uuid()
    .or(z.literal(""))
    .catch("")
    .transform((v) => v || null),
  expectedRequirement: optional(3000),
  message: optional(5000),
  preferredContact: z.enum(CONTACT_METHODS).catch("ANY"),
});

/** Public forms: demo requests need an organization; contact messages need a message. */
export function publicLeadSchema(mode: "demo" | "contact") {
  return leadFields
    .extend({ consent: z.literal("on", { errorMap: () => ({ message: "consent" }) }) })
    .superRefine((v, ctx) => {
      if (mode === "demo" && !v.organization) ctx.addIssue({ code: "custom", path: ["organization"], message: "required" });
      if (mode === "contact" && !v.message) ctx.addIssue({ code: "custom", path: ["message"], message: "required" });
    });
}

export type LeadFormState = {
  status: "idle" | "error" | "success";
  /** field → error code */
  errors?: Record<string, string>;
  /** form-level error: "rateLimited" | "captcha" | "generic" | "fix" */
  message?: "rateLimited" | "captcha" | "generic" | "fix";
};

/** Admin wording for the error codes above. */
export const ADMIN_ERROR_TEXT: Record<string, string> = {
  required: "This field is required.",
  email: "Enter a valid email address.",
  phone: "Enter a valid phone number.",
  tooLong: "This is too long.",
  consent: "Consent is required.",
};

/** Spreadsheet programs run cells starting with = + - @ as formulas; neutralise them. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
