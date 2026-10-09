import { BrandLockup } from "@/components/brand/BrandLockup";
import { getSiteInfo } from "@/lib/content/settings";
import { getNavMenu, type NavLink } from "@/lib/content/navigation";
import { getDesign } from "@/lib/content/design";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/i18n/config";
import { HeaderClient } from "./HeaderClient";
import { searchLabels } from "@/lib/public/labels";
import { marketMode } from "@/lib/market/data";
import type { TickerProps } from "@/components/market/TickerBar";
import { getPartyLogos } from "@/lib/public/flagship";

/** Header: menu from Admin → Navigation ("header" menu), logo from the brand asset. */
export async function SiteHeader({ locale }: { locale: AppLocale }) {
  const [rawItems, info, parties, design] = await Promise.all([getNavMenu("header", locale), getSiteInfo(locale), getPartyLogos(locale), getDesign()]);
  // Menu icons chosen in Admin → Design, matched by the link's path ("products/ost").
  const pathOf = (href: string | null) => (href ?? "").replace(/^\/(en|bn)(?=\/|$)/, "").replace(/^\/+/, "").replace(/\/+$/, "");
  const withIcons = (list: NavLink[]): NavLink[] =>
    list.map((i) => ({ ...i, ...(design.navIcons[pathOf(i.href)] && { icon: design.navIcons[pathOf(i.href)] }), children: withIcons(i.children) }));
  const items = withIcons(rawItems);
  const t = getMessages(locale);
  const mode = marketMode();
  // The ticker's settings, not an element: HeaderClient renders the ticker itself,
  // so the server and the browser build exactly the same tree (no hydration mismatch).
  const ticker: TickerProps | undefined =
    mode === "none"
      ? undefined
      : {
          mode,
          locale,
          logos: { DSE: parties.dse, CSE: parties.cse },
          labels: {
            region: t.tickerLabel,
            pause: t.tickerPause,
            play: t.tickerPlay,
            loading: t.tickerLoading,
            unavailable: t.tickerUnavailable,
            breadth: t.tickerBreadth,
            breadthShort: t.tickerBreadthShort,
            turnover: t.turnover,
            markets: t.tickerAllMarkets,
            board: t.tickerBoard,
            demo: t.demoData,
            status: { OPEN: t.marketStatusOPEN, CLOSED: t.marketStatusCLOSED, PRE_OPEN: t.marketStatusPRE_OPEN, POST_CLOSE: t.marketStatusPOST_CLOSE, HALTED: t.marketStatusHALTED },
          },
        };
  return (
    <HeaderClient
      locale={locale}
      items={items}
      labels={{ menu: t.menu, closeMenu: t.closeMenu, mainNavigation: t.mainNavigation, language: t.language, overview: t.overview, toLight: t.themeToLight, toDark: t.themeToDark, search: searchLabels(t) }}
      logo={<BrandLockup text="roomy" priority name={info.companyName} tagline={t.brandTagline} />}
      ticker={ticker}
    />
  );
}
