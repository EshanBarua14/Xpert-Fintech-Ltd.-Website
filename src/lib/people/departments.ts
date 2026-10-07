/**
 * Departments on the Team page: each has a colour (card stripe, avatar, filter
 * chip dot) and a Bangla name. A department typed in Admin → People that is
 * not listed here still works: it gets the neutral colour and its own name.
 *
 * Colours are mid-dark so white initials on them pass WCAG AA (4.5:1) and they
 * read on both the light and the dark theme.
 */

export const DEPARTMENT_NAMES = ["Leadership", "Engineering", "Support", "Infrastructure", "Marketing", "HR & Admin", "Operations"] as const;

type DeptStyle = { color: string; bn: string };

const STYLES: Record<string, DeptStyle> = {
  leadership: { color: "#8a5d0b", bn: "নেতৃত্ব" },
  engineering: { color: "#1d5fa8", bn: "ইঞ্জিনিয়ারিং" },
  support: { color: "#0b6e5d", bn: "সাপোর্ট" },
  infrastructure: { color: "#5a46c2", bn: "ইনফ্রাস্ট্রাকচার" },
  marketing: { color: "#b03a22", bn: "মার্কেটিং" },
  "hr & admin": { color: "#0e7490", bn: "এইচআর ও অ্যাডমিন" },
  operations: { color: "#8b2f6b", bn: "অপারেশনস" },
};

const NEUTRAL = "#4b5563";

export function departmentColor(name: string | null | undefined): string {
  return (name && STYLES[name.trim().toLowerCase()]?.color) || NEUTRAL;
}

export function departmentLabel(name: string, locale: string): string {
  return (locale === "bn" && STYLES[name.trim().toLowerCase()]?.bn) || name;
}

/** Order departments appear in the filter: the known ones first, then any others A–Z. */
export function departmentRank(name: string): number {
  const i = DEPARTMENT_NAMES.findIndex((d) => d.toLowerCase() === name.trim().toLowerCase());
  return i === -1 ? DEPARTMENT_NAMES.length : i;
}
