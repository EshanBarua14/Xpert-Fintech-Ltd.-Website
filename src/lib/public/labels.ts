import type { Messages } from "@/lib/i18n/messages";
import type { ShowcaseLabels } from "@/components/products/ProductShowcase";
import type { OmsPreviewLabels } from "@/components/products/oms-preview/OmsPreview";

/** Interface strings for the product showcase, from the message catalogue. */
export function showcaseLabels(t: Messages): ShowcaseLabels {
  return {
    explore: t.exploreProduct,
    workflow: t.howItWorks,
    capabilities: t.capabilities,
    conceptual: t.conceptualView,
    typeLabels: {
      PLATFORM: t.typePlatform,
      PRODUCT: t.typeProduct,
      MODULE: t.typeModule,
      INTEGRATION: t.typeIntegration,
      CAPABILITY: t.typeCapability,
      SERVICE: t.typeService,
    },
  };
}

/** OMS preview strings from the message catalogue. */
export function omsLabels(t: Messages): OmsPreviewLabels {
  return {
    banner: t.omsBanner,
    title: t.omsPreviewTitle,
    tabs: { watch: t.omsWatch, orders: t.omsOrders, positions: t.omsPositions, risk: t.omsRisk },
    symbol: t.omsSymbol, name: t.omsName, ltp: t.omsLast, change: t.omsChange, volume: t.omsVolume,
    side: t.omsSide, buy: t.omsBuy, sell: t.omsSell, qty: t.omsQty, price: t.omsPrice,
    place: t.omsPlace, reset: t.omsReset, pause: t.omsPause, resume: t.omsResume,
    status: { WORKING: t.omsWorking, FILLED: t.omsFilled, REJECTED: t.omsRejected, CANCELLED: t.omsCancelled },
    statusCol: t.omsStatus, cancel: t.omsCancel, passed: t.omsPassed, failed: t.omsFailed,
    avgPrice: t.omsAvg, marketValue: t.omsMarketValue, pnl: t.omsPnl,
    buyingPower: t.omsBuyingPower, maxOrderValue: t.omsMaxValue, priceBand: t.omsBand,
    noOrders: t.omsNoOrders, noPositions: t.omsNoPositions, ticket: t.omsTicket, checksTitle: t.omsChecks,
    checks: { qty: t.omsCheckQty, band: t.omsCheckBand, maxValue: t.omsCheckMax, buyingPower: t.omsCheckBp, holding: t.omsCheckHolding },
    up: t.omsUp, down: t.omsDown, unchanged: t.omsUnchanged, currency: t.omsCurrency,
  };
}

/** "FULL_TIME" → "Full time", in the visitor's language. */
export function employmentLabel(t: Messages, type: string) {
  return ({ FULL_TIME: t.jobFullTime, PART_TIME: t.jobPartTime, CONTRACT: t.jobContract, INTERNSHIP: t.jobInternship } as Record<string, string>)[type] ?? type;
}

/** Bangla for the usual job tags (department, location, experience), typed in English in Admin → Careers. */
const JOB_TAG_BN: Record<string, string> = {
  "project management": "প্রজেক্ট ম্যানেজমেন্ট",
  "it infrastructure": "আইটি অবকাঠামো",
  engineering: "ইঞ্জিনিয়ারিং",
  "software engineering": "সফটওয়্যার ইঞ্জিনিয়ারিং",
  "quality assurance": "কোয়ালিটি অ্যাসিউরেন্স",
  "customer support": "গ্রাহক সহায়তা",
  sales: "বিক্রয়",
  "business development": "ব্যবসা উন্নয়ন",
  operations: "অপারেশনস",
  finance: "অর্থ",
  "human resources": "মানবসম্পদ",
  marketing: "মার্কেটিং",
  design: "ডিজাইন",
  dhaka: "ঢাকা",
  chattogram: "চট্টগ্রাম",
  remote: "রিমোট",
};

/** A job tag in the visitor's language: known words in Bangla, "3–7 years" → "৩–৭ বছর". */
export function jobTag(value: string, locale: string) {
  if (locale !== "bn") return value;
  const known = JOB_TAG_BN[value.trim().toLowerCase()];
  if (known) return known;
  return value
    .replace(/^at least\s+/i, "কমপক্ষে ")
    .replace(/\byears?\b/i, "বছর")
    .replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]!);
}

/** Labels for the site search dialog and the /search page. */
export function searchLabels(t: Messages) {
  return {
    search: t.searchLabel,
    placeholder: t.searchPlaceholder,
    noResults: t.searchNoResults,
    hint: t.searchHint,
    seeAll: t.searchSeeAll,
    close: t.close,
    kinds: {
      product: t.searchKindProduct,
      page: t.searchKindPage,
      news: t.searchKindNews,
      event: t.searchKindEvent,
      person: t.searchKindPerson,
      organization: t.searchKindOrganization,
      career: t.searchKindCareer,
      caseStudy: t.searchKindCaseStudy,
      resource: t.searchKindResource,
      album: t.searchKindAlbum,
      video: t.searchKindVideo,
      symbol: t.searchKindSymbol,
    },
  };
}
