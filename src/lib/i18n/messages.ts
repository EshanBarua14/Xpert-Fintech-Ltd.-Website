import en from "@/messages/en.json";
import bn from "@/messages/bn.json";
import type { AppLocale } from "./config";

/**
 * Fixed interface strings (buttons, labels, ARIA text). Page content comes
 * from the CMS, not from here. Bangla strings need review by an Xpert editor.
 */
export type Messages = typeof en;

const catalogs: Record<AppLocale, Messages> = { en, bn };

export function getMessages(locale: AppLocale): Messages {
  return catalogs[locale];
}
