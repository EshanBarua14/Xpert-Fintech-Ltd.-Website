/**
 * Seed content for product workflows (rendered by WorkflowDiagram).
 * Store in the CMS on first seed; admins edit afterwards. Bangla text should be reviewed by XFL.
 * Steps with `requires` are hidden until that ecosystem node/offering is published (e.g. eKYC).
 */
import type { I18n } from "./ecosystem";

export interface WorkflowSeedStep { id: string; title: I18n; body?: I18n; requires?: string }
export interface WorkflowSeed { offeringKey: string; label: I18n; steps: WorkflowSeedStep[] }

export const workflowSeeds: WorkflowSeed[] = [
  {
    offeringKey: "oms",
    label: { en: "OMS order workflow", bn: "ওএমএস অর্ডার প্রক্রিয়া" },
    steps: [
      { id: "order", title: { en: "Order entry", bn: "অর্ডার প্রদান" }, body: { en: "A trader or investor enters an order on web, desktop or mobile.", bn: "ট্রেডার বা বিনিয়োগকারী ওয়েব, ডেস্কটপ বা মোবাইলে অর্ডার দেন।" } },
      { id: "risk", title: { en: "Pre-trade risk check", bn: "ট্রেডের আগে ঝুঁকি যাচাই" }, body: { en: "RMS checks the order against limits before it leaves the brokerage.", bn: "ব্রোকারেজ থেকে পাঠানোর আগে আরএমএস সীমার সঙ্গে অর্ডার যাচাই করে।" } },
      { id: "exchange", title: { en: "Exchange", bn: "এক্সচেঞ্জ" }, body: { en: "The order is routed to DSE or CSE.", bn: "অর্ডার ডিএসই বা সিএসইতে পাঠানো হয়।" } },
      { id: "execution", title: { en: "Execution", bn: "সম্পাদন" }, body: { en: "Executions are reported back to the OMS.", bn: "সম্পাদনের তথ্য ওএমএসে ফেরত আসে।" } },
      { id: "position", title: { en: "Position update", bn: "পজিশন হালনাগাদ" }, body: { en: "Holdings and buying power update.", bn: "হোল্ডিং ও ক্রয়ক্ষমতা হালনাগাদ হয়।" } },
      { id: "backoffice", title: { en: "Back office", bn: "ব্যাক অফিস" }, body: { en: "Trades flow to settlement and reporting.", bn: "লেনদেন সেটেলমেন্ট ও রিপোর্টিংয়ে যায়।" } },
    ],
  },
  {
    offeringKey: "rms",
    label: { en: "RMS risk workflow", bn: "আরএমএস ঝুঁকি প্রক্রিয়া" },
    steps: [
      { id: "order", title: { en: "Order", bn: "অর্ডার" } },
      { id: "pretrade", title: { en: "Pre-trade check", bn: "ট্রেডের আগে যাচাই" }, body: { en: "Each order is checked before submission.", bn: "জমা দেওয়ার আগে প্রতিটি অর্ডার যাচাই হয়।" } },
      { id: "limits", title: { en: "Limits", bn: "সীমা" }, body: { en: "Configured limits are applied per client and per brokerage.", bn: "গ্রাহক ও ব্রোকারেজভিত্তিক নির্ধারিত সীমা প্রয়োগ হয়।" } },
      { id: "engine", title: { en: "Risk engine", bn: "ঝুঁকি ইঞ্জিন" }, body: { en: "The order is accepted or rejected with a reason.", bn: "কারণসহ অর্ডার গ্রহণ বা প্রত্যাখ্যান করা হয়।" } },
      { id: "execution", title: { en: "Execution", bn: "সম্পাদন" } },
      { id: "position", title: { en: "Position", bn: "পজিশন" } },
      { id: "monitoring", title: { en: "Monitoring", bn: "পর্যবেক্ষণ" }, body: { en: "Exposure is monitored after execution.", bn: "সম্পাদনের পর ঝুঁকির মাত্রা পর্যবেক্ষণ করা হয়।" } },
    ],
  },
  {
    offeringKey: "dms",
    label: { en: "DMS document workflow", bn: "ডিএমএস নথি প্রক্রিয়া" },
    steps: [
      { id: "capture", title: { en: "Document capture", bn: "নথি সংগ্রহ" } },
      { id: "store", title: { en: "Secure storage", bn: "নিরাপদ সংরক্ষণ" } },
      { id: "access", title: { en: "Controlled access", bn: "নিয়ন্ত্রিত প্রবেশাধিকার" }, body: { en: "Only authorised staff can view or act on documents.", bn: "শুধু অনুমোদিত কর্মীরা নথি দেখতে বা ব্যবহার করতে পারেন।" } },
      { id: "approval", title: { en: "Workflow approval", bn: "অনুমোদন প্রক্রিয়া" } },
      { id: "audit", title: { en: "Audit trail", bn: "অডিট ট্রেইল" }, body: { en: "Every action on a document is recorded.", bn: "নথির প্রতিটি কাজ রেকর্ড করা হয়।" } },
    ],
  },
  {
    offeringKey: "bo-account-opening",
    label: { en: "BO account opening workflow", bn: "বিও অ্যাকাউন্ট খোলার প্রক্রিয়া" },
    steps: [
      { id: "start", title: { en: "Start application", bn: "আবেদন শুরু" } },
      { id: "identity", title: { en: "Identity information", bn: "পরিচয়ের তথ্য" } },
      { id: "docs", title: { en: "Document capture", bn: "নথি সংগ্রহ" }, body: { en: "Required documents are uploaded and kept in DMS.", bn: "প্রয়োজনীয় নথি আপলোড করে ডিএমএসে রাখা হয়।" } },
      { id: "ekyc", title: { en: "eKYC", bn: "ই-কেওয়াইসি" }, requires: "ekyc" },
      { id: "review", title: { en: "Review", bn: "পর্যালোচনা" } },
      { id: "approval", title: { en: "Approval", bn: "অনুমোদন" } },
      { id: "created", title: { en: "BO account created", bn: "বিও অ্যাকাউন্ট তৈরি" } },
      { id: "ready", title: { en: "Investor ready", bn: "বিনিয়োগকারী প্রস্তুত" } },
    ],
  },
];

/** Resolve a workflow for rendering: drops steps whose required node is unpublished or untranslated. */
export function resolveWorkflow(seed: WorkflowSeed, locale: "en" | "bn", published: Set<string>) {
  return {
    label: seed.label[locale] ?? "",
    steps: seed.steps
      .filter((s) => (!s.requires || published.has(s.requires)) && Boolean(s.title[locale]))
      .map((s) => ({ id: s.id, title: s.title[locale]!, body: s.body?.[locale] })),
  };
}
