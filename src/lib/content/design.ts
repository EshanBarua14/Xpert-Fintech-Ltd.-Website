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
/**
 * Home page sections, in their default order (as before the 19 Oct reorder): clients,
 * then the company's strength (who owns Xpert, core strengths), then the products
 * (phones, savings, market share, showcase, desks), reviews, apps, how it works,
 * consortium, principles, added sections and news. Admin → Design → Home
 * page hides sections and changes the order. `toggle: false`: shown by its own setting.
 */
export const HOME_SECTIONS = [
  { key: "clients", label: "Client logos" },
  { key: "ownership", label: "Who owns Xpert (Admin → Home highlights)" },
  { key: "strengths", label: "Core strengths (Admin → Home highlights)" },
  { key: "phones", label: "Floating phones (product screens on mobile)" },
  { key: "savings", label: "Cost savings graphic (Admin → Home highlights)" },
  { key: "reach", label: "Market share and client base" },
  { key: "figures", label: "Xpert in numbers (Admin → Figures)" },
  { key: "showcase", label: "Product showcase" },
  { key: "roles", label: "Built for every desk (products by role)" },
  { key: "testimonials", label: "Client reviews" },
  { key: "market", label: "Today on DSE and CSE (switched on under DSE · CSE prices)", toggle: false },
  { key: "apps", label: "Live branded apps" },
  { key: "flow", label: "Order flow" },
  { key: "rms", label: "Risk checks (RMS, built into the OMS)" },
  { key: "consortium", label: "Consortium logos" },
  { key: "principles", label: "Principles" },
  { key: "custom", label: "Sections added in Admin → Pages → Home", toggle: false },
  { key: "events", label: "Events" },
] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number]["key"];

/** Where the DSE · CSE price ticker runs: only on the market pages (each exchange's page shows its own), on every page, or nowhere. */
export const TICKER_PLACES = [
  { value: "markets", label: "Only on the market pages (DSE page: DSE, CSE page: CSE)" },
  { value: "all", label: "At the top of every page" },
  { value: "off", label: "Nowhere" },
] as const;
export type TickerPlace = (typeof TICKER_PLACES)[number]["value"];

export type ProductLook = { from?: string; to?: string; icon?: string };
export type Design = {
  colors: Partial<Record<(typeof COLOR_FIELDS)[number]["key"], string>>;
  tones: Partial<Record<(typeof TONE_FIELDS)[number]["key"], string>>;
  products: Record<string, ProductLook>;
  navIcons: Record<string, string>;
  hidden: HomeSection[];
  /** Home sections in the order shown (every key, defaults filling any missing). */
  order: HomeSection[];
  ticker: TickerPlace;
  /** DSE and CSE index tiles in the home page hero. */
  heroIndices: boolean;
  /** The "Today on DSE and CSE" cards on the home page (by default only on the DSE and CSE pages). */
  homeMarket: boolean;
};

const HEX = /^#[0-9a-f]{6}$/i;
const hex = (v: unknown) => (typeof v === "string" && HEX.test(v.trim()) ? v.trim().toLowerCase() : undefined);
const icon = (v: unknown) => (typeof v === "string" && ICON_NAMES.includes(v) ? v : undefined);
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const clean = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

/** A stored order, cleaned: known keys once each, and any section it lacks put back at its default place. */
function readOrder(v: unknown): HomeSection[] {
  const keys = HOME_SECTIONS.map((s) => s.key) as HomeSection[];
  const given = (Array.isArray(v) ? v : []).filter((x, i, a): x is HomeSection => keys.includes(x as HomeSection) && a.indexOf(x) === i);
  if (!given.length) return keys;
  const out = [...given];
  keys.forEach((k, i) => {
    if (out.includes(k)) return;
    // After the nearest section that comes before it by default.
    const prev = keys.slice(0, i).reverse().find((p) => out.includes(p));
    out.splice(prev ? out.indexOf(prev) + 1 : 0, 0, k);
  });
  return out;
}

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
    order: readOrder(v.order),
    ticker: TICKER_PLACES.some((t) => t.value === v.ticker) ? (v.ticker as TickerPlace) : "markets",
    heroIndices: v.heroIndices === true,
    homeMarket: v.homeMarket === true,
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
