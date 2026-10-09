/**
 * Numbers in the page's script: Bangla digits (০–৯) on the Bangla site.
 * Shared by server and browser components.
 */
const BN = "০১২৩৪৫৬৭৮৯";
const BENGALI = /[ঀ-৿]/;

/** A number (or a string of digits) in Bangla digits when `bn` is true. */
export function digits(v: string | number, bn: boolean): string {
  const s = String(v);
  return bn ? s.replace(/[0-9]/g, (d) => BN[Number(d)]!) : s;
}

/**
 * Fills "{n} photos" / "{n}টি ছবি" style text. Numeric values follow the
 * text's script: in a Bangla text they are written in Bangla digits. Values
 * that are not plain numbers (a trading code such as DS30, a name) are left as they are.
 */
export function fill(template: string, vars: Record<string, string | number>): string {
  const bn = BENGALI.test(template);
  return template.replace(/\{(\w+)\}/g, (m, k: string) => {
    if (!(k in vars)) return m;
    const v = vars[k]!;
    return typeof v === "number" || /^[\d.,\s/–-]+$/.test(v) ? digits(v, bn) : v;
  });
}
