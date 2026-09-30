"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { NavLink } from "@/lib/content/navigation";
import type { AppLocale } from "@/lib/i18n/config";
import { ButtonLink } from "@/components/ui/Button";
import { LanguageSwitch } from "./LanguageSwitch";
import { cn } from "@/lib/utils/cn";

type Labels = { menu: string; closeMenu: string; mainNavigation: string; language: string };

function ItemLink({ item, className, onNavigate }: { item: NavLink; className?: string; onNavigate?: () => void }) {
  if (!item.href) return <span className={className}>{item.label}</span>;
  if (item.external) {
    return (
      <a
        href={item.href}
        className={className}
        target={item.newTab ? "_blank" : undefined}
        rel={item.newTab ? "noopener noreferrer" : undefined}
      >
        {item.label}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

/** Desktop item with an optional dropdown, opened by hover, focus or click. */
function DesktopItem({ item, active }: { item: NavLink; active: boolean }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const linkClass = cn(
    "rounded-control px-3 py-2 text-sm transition-colors hover:text-brand-sky",
    active ? "text-text-primary" : "text-text-secondary",
  );

  if (item.children.length === 0) {
    return (
      <li>
        <ItemLink item={item} className={linkClass} />
      </li>
    );
  }

  return (
    <li
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <button
        type="button"
        className={cn(linkClass, "inline-flex items-center gap-1")}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {item.label}
        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" className={cn("transition-transform", open && "rotate-180")}>
          <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute top-full left-0 z-(--z-dropdown) min-w-72 pt-2"
      >
        <ul className="rounded-card border border-white/10 bg-navy-900 p-2 shadow-2xl shadow-black/40">
          {item.href && (
            <li>
              <ItemLink item={{ ...item, children: [] }} className="block rounded-control px-3 py-2 text-sm font-medium hover:bg-white/5" />
            </li>
          )}
          {item.children.map((child) => (
            <li key={child.id}>
              <ItemLink item={child} className="block rounded-control px-3 py-2 text-sm hover:bg-white/5 hover:text-brand-sky" />
              {child.description && <p className="px-3 pb-2 text-xs text-text-secondary">{child.description}</p>}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/** Mobile item: group headings expand in place; links close the drawer. */
function MobileItem({ item, onNavigate }: { item: NavLink; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rowClass = "flex w-full items-center justify-between py-3 text-base";

  if (item.children.length === 0) {
    return (
      <li className="border-b border-white/10">
        <ItemLink item={item} className={rowClass} onNavigate={onNavigate} />
      </li>
    );
  }
  return (
    <li className="border-b border-white/10">
      <button type="button" className={rowClass} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        {item.label}
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 10 10" className={cn("transition-transform", open && "rotate-180")}>
          <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <ul id={panelId} hidden={!open} className="pb-3 pl-4">
        {item.href && (
          <li>
            <ItemLink item={{ ...item, children: [] }} className="block py-2 text-sm text-text-secondary" onNavigate={onNavigate} />
          </li>
        )}
        {item.children.map((child) => (
          <li key={child.id}>
            <ItemLink item={child} className="block py-2 text-sm text-text-secondary" onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </li>
  );
}

export function HeaderClient({
  locale,
  items,
  labels,
  logo,
}: {
  locale: AppLocale;
  items: NavLink[];
  labels: Labels;
  logo: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerId = useId();

  const links = items.filter((i) => !i.isCta);
  const cta = items.find((i) => i.isCta && i.href);

  // Close the drawer after navigation.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Subtle border once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Drawer open: lock page scroll, move focus in, close on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const isActive = (item: NavLink) => !!item.href && !!pathname && pathname.startsWith(item.href) && item.href !== `/${locale}`;

  return (
    <header
      className={cn(
        "sticky top-0 z-(--z-sticky) border-b bg-ink-950/85 backdrop-blur-md transition-colors",
        scrolled ? "border-white/10" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 md:h-20 md:px-8">
        <Link href={`/${locale}`} className="shrink-0" aria-label="Xpert Fintech Ltd. — home">
          {logo}
        </Link>

        <nav aria-label={labels.mainNavigation} className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {links.map((item) => (
              <DesktopItem key={item.id} item={item} active={isActive(item)} />
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitch current={locale} label={labels.language} className="hidden md:flex" />
          {cta?.href && (
            <ButtonLink href={cta.href} size="sm" className="hidden sm:inline-flex">
              {cta.label}
            </ButtonLink>
          )}
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-white/15 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls={drawerId}
            aria-label={menuOpen ? labels.closeMenu : labels.menu}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
              {menuOpen ? (
                <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.5" />
              ) : (
                <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        id={drawerId}
        ref={drawerRef}
        hidden={!menuOpen}
        className="fixed inset-x-0 top-16 bottom-0 z-(--z-drawer) overflow-y-auto border-t border-white/10 bg-ink-950 px-4 pb-10 md:top-20 lg:hidden"
      >
        <nav aria-label={labels.mainNavigation}>
          <ul>
            {links.map((item) => (
              <MobileItem key={item.id} item={item} onNavigate={() => setMenuOpen(false)} />
            ))}
          </ul>
        </nav>
        <div className="mt-6 flex flex-col gap-4">
          {cta?.href && (
            <ButtonLink href={cta.href} size="lg" className="w-full">
              {cta.label}
            </ButtonLink>
          )}
          <LanguageSwitch current={locale} label={labels.language} />
        </div>
      </div>
    </header>
  );
}
