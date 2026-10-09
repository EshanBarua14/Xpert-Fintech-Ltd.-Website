import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { ICON_NAMES } from "@/components/ui/Icon";

/**
 * Admin → Design: the site's colours, the people-card group colours, each
 * product's colours and symbol, the menu icons, and which home-page sections
 * show. Stored as one setting; anything left empty keeps the built-in look.
 */
export const DESIGN_KEY = "site.design";

export const COLOR_FIELDS = [
  { key: "royal", label: "Primary (buttons)", css: "--color-brand-royal", theme: "both" },
  { key: "sky", label: "Accent on dark", css: "--color-brand-sky", theme: "dark" },
  { key: "skyLight", label: "Accent on light", css: "--color-brand-sky", theme: "light" },
  { key: "gold", label: "Highlight (gold) on dark", css: "--color-gold", theme: "dark" },
  { key: "goldLight", label: "Highlight (gold) on light", css: "--color-gold", theme: "light" },
] as const;
export const TONE_FIELDS = [
  { key: "board", label: "Board of directors" },
  { key: "management", label: "Management" },
  { key: "consultant", label: "Consultants" },
  { key: "team", label: "Team leadership" },
] as const;
export const HOME_SECTIONS = [
  { key: "clients", label: "Client logos" },
  { key: "reach", label: "Market share and client base" },
  { key: "showcase", label: "Product showcase" },
  { key: "roles", label: "Built for every desk (products by role)" },
  { key: "testimonials", label: "Client reviews" },
  { key: "market", label: "Today on DSE and CSE" },
  { key: "apps", label: "Live branded apps" },
  { key: "flow", label: "Order flow" },
  { key: "consortium", label: "Consortium logos" },
  { key: "principles", label: "Principles" },
  { key: "events", label: "Events" },
] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number]["key"];

export type ProductLook = { from?: string; to?: string; icon?: string };
export type Design = {
  colors: Partial<Record<(typeof COLOR_FIELDS)[number]["key"], string>>;
  tones: Partial<Record<(typeof TONE_FIELDS)[number]["key"], string>>;
  products: Record<string, ProductLook>;
  navIcons: Record<string, string>;
  hidden: HomeSection[];
};

const HEX = /^#[0-9a-f]{6}$/i;
const hex = (v: unknown) => (typeof v === "string" && HEX.test(v.trim()) ? v.trim().toLowerCase() : undefined);
const icon = (v: unknown) => (typeof v === "string" && ICON_NAMES.includes(v) ? v : undefined);
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const clean = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

export function readDesign(value: unknown): Design {
  const v = obj(value);
  const colors = obj(v.colors);
  const tones = obj(v.tones);
  return {
    colors: clean(Object.fromEntries(COLOR_FIELDS.map((f) => [f.key, hex(colors[f.key])]))),
    tones: clean(Object.fromEntries(TONE_FIELDS.map((f) => [f.key, hex(tones[f.key])]))),
    products: Object.fromEntries(
      Object.entries(obj(v.products))
        .map(([k, p]) => [k, clean({ from: hex(obj(p).from), to: hex(obj(p).to), icon: icon(obj(p).icon) })] as const)
        .filter(([, p]) => Object.keys(p).length),
    ),
    navIcons: Object.fromEntries(Object.entries(obj(v.navIcons)).flatMap(([k, i]) => (icon(i) ? [[k, icon(i)!]] : []))),
    hidden: (Array.isArray(v.hidden) ? v.hidden : []).filter((x): x is HomeSection => HOME_SECTIONS.some((s) => s.key === x)),
  };
}

export const getDesign = cache(async (): Promise<Design> => {
  const row = await db.siteSetting.findUnique({ where: { key: DESIGN_KEY } }).catch(() => null);
  return readDesign(row?.value);
});

/** The CSS that applies the chosen colours (empty when nothing is changed). */
export function designCss(d: Design): string {
  const dark: string[] = [];
  const light: string[] = [];
  for (const f of COLOR_FIELDS) {
    const c = d.colors[f.key];
    if (!c) continue;
    if (f.theme !== "light") dark.push(`${f.css}:${c}`);
    if (f.theme !== "dark") light.push(`${f.css}:${c}`);
  }
  const rules: string[] = [];
  if (dark.length) rules.push(`html:root{${dark.join(";")}}`);
  if (light.length) rules.push(`html[data-theme="light"]{${light.join(";")}}`);
  for (const t of TONE_FIELDS) {
    const c = d.tones[t.key];
    if (c) rules.push(`html .people-tone-${t.key}{--tone:${c};--tone-ink:${c}}`);
  }
  return rules.join("\n");
}
