/**
 * Logos of Xpert's clients, supplied by XFL (October 2026), in
 * prisma/seed-media/logos/<key>.png (borders trimmed, colours untouched).
 * `npm run db:seed:content` attaches each logo to the organization with the
 * same key or name (consortium members included) and adds the clients not in
 * the database yet. A logo already set in Admin → Organizations is kept.
 */
export type ClientLogo = { key: string; name: string };

export const CLIENT_LOGOS: ClientLogo[] = [
  // Consortium members
  { key: "apex-investments", name: "Apex Investments Ltd." },
  { key: "bank-asia-securities", name: "Bank Asia Securities Ltd." },
  { key: "ebl-securities", name: "EBL Securities PLC" },
  { key: "green-delta-securities", name: "Green Delta Securities Ltd." },
  { key: "islami-bank-securities", name: "Islami Bank Securities Ltd." },
  { key: "mika-securities", name: "Mika Securities Ltd." },
  { key: "nli-securities", name: "NLI Securities Ltd." },
  { key: "one-securities", name: "ONE Securities Ltd." },
  { key: "sjibl-securities", name: "Shahjalal Islami Bank Securities Ltd." },
  { key: "ucb-stock-brokerage", name: "UCB Stock Brokerage Ltd." },
  // Other clients
  { key: "first-capital-securities", name: "First Capital Securities Limited" },
  { key: "innova-securities", name: "Innova Securities Ltd." },
  { key: "monarch-holdings", name: "Monarch Holdings Ltd." },
  { key: "royal-capital", name: "Royal Capital" },
  { key: "wifang-securities", name: "Wifang Securities Ltd." },
  { key: "skyline", name: "Skyline" },
];

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
