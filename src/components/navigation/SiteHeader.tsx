import { BrandLockup } from "@/components/brand/BrandLockup";
import { getNavMenu } from "@/lib/content/navigation";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/i18n/config";
import { HeaderClient } from "./HeaderClient";
import { searchLabels } from "@/lib/public/labels";
import { marketMode } from "@/lib/market/data";
import { TickerBar } from "@/components/market/TickerBar";

/** Header: menu from Admin → Navigation ("header" menu), logo from the brand asset. */
export async function SiteHeader({ locale }: { locale: AppLocale }) {
  const items = await getNavMenu("header", locale);
  const t = getMessages(locale);
  const mode = marketMode();
  const ticker =
    mode === "none" ? undefined : (
      <TickerBar
        mode={mode}
        locale={locale}
        labels={{
          region: t.tickerLabel,
          pause: t.tickerPause,
          play: t.tickerPlay,
          loading: t.tickerLoading,
          unavailable: t.tickerUnavailable,
          xpertShare: t.tickerXpertShare,
          breadth: t.tickerBreadth,
          breadthShort: t.tickerBreadthShort,
          turnover: t.turnover,
          markets: t.tickerAllMarkets,
          board: t.tickerBoard,
          demo: t.demoData,
          status: { OPEN: t.marketStatusOPEN, CLOSED: t.marketStatusCLOSED, PRE_OPEN: t.marketStatusPRE_OPEN, HALTED: t.marketStatusHALTED },
        }}
      />
    );
  return (
    <HeaderClient
      locale={locale}
      items={items}
      labels={{ menu: t.menu, closeMenu: t.closeMenu, mainNavigation: t.mainNavigation, language: t.language, overview: t.overview, toLight: t.themeToLight, toDark: t.themeToDark, search: searchLabels(t) }}
      logo={<BrandLockup text="roomy" priority />}
      ticker={ticker}
    />
  );
}
