/**
 * Logos of Xpert's clients, supplied by XFL (October 2026), in
 * prisma/seed-media/logos/<key>.png (borders trimmed, colours untouched).
 * `npm run db:seed:content` attaches each logo to the organization with the
 * same key or name (consortium members included) and adds the clients not in
 * the database yet. A logo already set in Admin → Organizations is kept.
 */
export type ClientLogo = { key: string; name: string };

export const CLIENT_LOGOS: ClientLogo[] = [
  // The 12 consortium members (all of them run Xpert)
  { key: "apex-investments", name: "Apex Investments Ltd." },
  { key: "bank-asia-securities", name: "Bank Asia Securities Ltd." },
  { key: "ebl-securities", name: "EBL Securities PLC" },
  { key: "green-delta-securities", name: "Green Delta Securities Ltd." },
  { key: "islami-bank-securities", name: "Islami Bank Securities Ltd." },
  { key: "nli-securities", name: "NLI Securities Ltd." },
  { key: "one-securities", name: "ONE Securities Ltd." },
  { key: "sjibl-securities", name: "Shahjalal Islami Bank Securities Ltd." },
  { key: "ucb-stock-brokerage", name: "UCB Stock Brokerage Ltd." },
  { key: "mika-securities", name: "Mika Securities Ltd." },
  { key: "ab-securities", name: "AB Securities Limited" },
  { key: "remons-investment", name: "Remons Investment & Securities Ltd" },
  // Other clients (XFL's list, October 2026); those without a logo file show their name
  { key: "skyline", name: "Skyline" },
  { key: "first-capital-securities", name: "First Capital Securities Limited" },
];

/**
 * Added as clients earlier from a logo set, but not on XFL's confirmed client
 * list: the seed moves them to drafts (logos stay in the media library).
 */
export const NOT_CLIENTS = ["innova-securities", "monarch-holdings", "royal-capital", "wifang-securities", "idlc-securities", "thia-securities"];

/** "Bank Asia Securities Limited" and "Bank Asia Securities Ltd." are the same organization. */
export function orgNameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[.,()'’]/g, " ")
    .replace(/\b(limited|ltd|plc|pvt|private|company|co)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
