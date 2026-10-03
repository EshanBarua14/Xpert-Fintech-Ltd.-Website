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
