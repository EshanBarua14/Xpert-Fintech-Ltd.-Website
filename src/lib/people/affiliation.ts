/**
 * Splits a position such as "Managing Director & CEO, UCB Stock Brokerage Ltd."
 * or "Managing Partner of Ali Zahir Ashraf & Co." into the designation and the
 * institution, so cards can set them on separate lines in their own styles.
 * Text that names no institution is returned as the designation.
 */
const ORG_WORD =
  /\b(ltd|limited|plc|securities|bank|brokerage|investments?|capital|exchange|company|co|group|insurance|associates|partners|corporation|fintech|stock|holdings|fund|chartered|accountants|bangladesh|lanka|industries)\b|লিমিটেড|সিকিউরিটিজ|ব্যাংক|ব্রোকারেজ|ইনভেস্টমেন্ট|এক্সচেঞ্জ/i;

export function splitAffiliation(text: string | null | undefined): { designation: string | null; institution: string | null } {
  const value = (text ?? "").trim();
  if (!value) return { designation: null, institution: null };
  // "X, Institution" — the last comma whose remainder names an institution.
  for (let i = value.lastIndexOf(","); i > 0; i = value.lastIndexOf(",", i - 1)) {
    const head = value.slice(0, i).trim();
    const tail = value.slice(i + 1).trim();
    if (head && tail && ORG_WORD.test(tail) && !ORG_WORD.test(head)) return { designation: head, institution: tail };
  }
  // "Managing Partner of Institution" / "… at Institution"
  const m = value.match(/^(.+?)\s+(?:of|at)\s+(.+)$/i);
  if (m && ORG_WORD.test(m[2]!)) return { designation: m[1]!.trim(), institution: m[2]!.trim() };
  // "Institution" alone
  if (ORG_WORD.test(value) && !value.includes(",")) return { designation: null, institution: value };
  return { designation: value, institution: null };
}

export const institutionOf = (text: string | null | undefined) => splitAffiliation(text).institution;
