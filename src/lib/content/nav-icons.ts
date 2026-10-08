/** Picks an icon for a menu link from where it goes. */
export function iconFor(href: string | null): string {
  const h = href ?? "";
  if (/\/markets(\/|$)/.test(h)) return "chart";
  if (/trading|oms|#trading/.test(h)) return "exchange";
  if (/rms|risk/.test(h)) return "shield";
  if (/ekyc/.test(h)) return "id";
  if (/bo-account|#bo/.test(h)) return "users";
  if (/dms/.test(h)) return "document";
  if (/back-office|#back/.test(h)) return "chart";
  if (/market-data|#data/.test(h)) return "globe";
  if (/board|management|people|consortium/.test(h)) return "users";
  if (/contact/.test(h)) return "mail";
  if (/#videos|videos/.test(h)) return "video";
  if (/gallery/.test(h)) return "image";
  if (/news|insights/.test(h)) return "newspaper";
  if (/events/.test(h)) return "calendar";
  if (/careers/.test(h)) return "briefcase";
  if (/resources/.test(h)) return "book";
  if (/case-studies/.test(h)) return "document";
  if (/about|company/.test(h)) return "globe";
  return "network";
}

