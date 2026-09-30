import { Logo } from "@/components/brand/Logo";
import { getNavMenu } from "@/lib/content/navigation";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/i18n/config";
import { HeaderClient } from "./HeaderClient";

/** Header: menu from Admin → Navigation ("header" menu), logo from the brand asset. */
export async function SiteHeader({ locale }: { locale: AppLocale }) {
  const items = await getNavMenu("header", locale);
  const t = getMessages(locale);
  return (
    <HeaderClient
      locale={locale}
      items={items}
      labels={{ menu: t.menu, closeMenu: t.closeMenu, mainNavigation: t.mainNavigation, language: t.language }}
      logo={<Logo height={48} priority />}
    />
  );
}
