/** Number formatting for market figures, in the page language (Bangla digits for bn). */
export function fmt(locale: "en" | "bn", value: number, digits = 2) {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function signed(locale: "en" | "bn", value: number, digits = 2, suffix = "") {
  const s = fmt(locale, Math.abs(value), digits);
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${s}${suffix}`;
}

/** BDT amounts in crore (1 crore = 10,000,000), the unit used in Bangladesh market reporting. */
export function crore(locale: "en" | "bn", bdt: number) {
  return `৳${fmt(locale, bdt / 1e7, bdt / 1e7 >= 100 ? 1 : 2)} ${locale === "bn" ? "কোটি" : "cr"}`;
}

export function compact(locale: "en" | "bn", value: number) {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function dhakaTime(locale: "en" | "bn", iso: string) {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
    // 24-hour clock: Bangla has no AM/PM of its own (Intl writes "PM" in Latin letters).
    hour12: false,
  }).format(new Date(iso));
}
