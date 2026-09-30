"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { NavLink } from "@/lib/content/navigation";
import type { AppLocale } from "@/lib/i18n/config";
import { Icon } from "@/components/ui/Icon";
import { LanguageSwitch } from "./LanguageSwitch";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils/cn";

type Labels = { menu: string; closeMenu: string; mainNavigation: string; language: string; overview: string; toLight: string; toDark: string };

/** Picks an icon for a menu link from where it goes. */
function iconFor(href: string | null): string {
  const h = href ?? "";
  if (/trading|oms|#trading/.test(h)) return "exchange";
  if (/rms|risk/.test(h)) return "shield";
  if (/ekyc/.test(h)) return "id";
  if (/bo-account|#bo/.test(h)) return "users";
  if (/dms/.test(h)) return "document";
  if (/back-office|#back/.test(h)) return "chart";
  if (/market-data|#data/.test(h)) return "globe";
  if (/board|management|people|consortium/.test(h)) return "users";
  if (/contact/.test(h)) return "mail";
  if (/events|news|insights/.test(h)) return "bolt";
  if (/about|company/.test(h)) return "globe";
  return "network";
}

function ItemLink({
  item,
  className,
  onNavigate,
  children,
}: {
  item: NavLink;
  className?: string;
  onNavigate?: () => void;
  children?: ReactNode;
}) {
  const content = children ?? item.label;
  if (!item.href) return <span className={className}>{content}</span>;
  if (item.external) {
    return (
      <a href={item.href} className={className} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noopener noreferrer" : undefined}>
        {content}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      {content}
    </Link>
  );
}

/** Rich dropdown: overview card on the left, links with icons and descriptions on the right. */
function MegaPanel({ item, id, overview, onNavigate }: { item: NavLink; id: string; overview: string; onNavigate: () => void }) {
  return (
    <div id={id} className="absolute inset-x-0 top-full pt-3">
      <div className="glass-strong mega-in grid gap-2 rounded-3xl p-2 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] md:grid-cols-[17rem_1fr]">
        <div className="relative hidden overflow-hidden rounded-2xl border border-fg/10 bg-gradient-to-br from-brand-royal/40 via-navy-800 to-ink-950 p-6 md:flex md:flex-col md:justify-end">
          <div className="grid-fade pointer-events-none absolute inset-0 opacity-50" />
          <span className="relative mb-auto flex size-11 items-center justify-center rounded-2xl bg-fg/10 text-cyan-300">
            <Icon name={iconFor(item.href)} className="size-5" />
          </span>
          <p className="relative mt-10 font-display text-xl font-semibold">{item.label}</p>
          {item.description && <p className="relative mt-2 text-sm text-text-secondary">{item.description}</p>}
          {item.href && (
            <ItemLink item={{ ...item, children: [] }} onNavigate={onNavigate} className="relative mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-fg">
              {overview} <span aria-hidden="true">→</span>
            </ItemLink>
          )}
        </div>
        <ul className="grid content-start gap-1 p-2 sm:grid-cols-2">
          {item.children.map((child) => (
            <li key={child.id}>
              <ItemLink item={child} onNavigate={onNavigate} className="group flex gap-3 rounded-2xl p-3 transition-colors hover:bg-fg/[0.06]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-fg/10 bg-fg/[0.04] text-brand-sky transition-colors group-hover:border-brand-sky/50 group-hover:text-cyan-300">
                  <Icon name={iconFor(child.href)} className="size-[18px]" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-text-primary">{child.label}</span>
                  {child.description && <span className="text-xs leading-relaxed text-text-secondary">{child.description}</span>}
                </span>
              </ItemLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
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
  const [openId, setOpenId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerId = useId();
  const panelBase = useId();

  const links = items.filter((i) => !i.isCta);
  const cta = items.find((i) => i.isCta && i.href);

  useEffect(() => {
    setMenuOpen(false);
    setOpenId(null);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenId(null);
      if (menuOpen) {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const open = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenId(id);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 140);
  };

  const isActive = (item: NavLink) =>
    !!pathname &&
    [item, ...item.children].some((i) => !!i.href && i.href !== `/${locale}` && pathname.startsWith(i.href.split("#")[0]!));

  return (
    <header className="fixed inset-x-0 top-0 z-(--z-sticky) px-3 pt-3 md:px-6 md:pt-4">
      <div
        className={cn(
          "relative mx-auto flex h-14 max-w-7xl items-center gap-2 rounded-full border px-2 pl-4 transition-[background-color,border-color,box-shadow] duration-500 md:h-16",
          scrolled || openId ? "glass-strong shadow-[0_12px_40px_-12px_rgb(0_0_0/0.7)]" : "border-transparent bg-transparent",
        )}
        onMouseLeave={scheduleClose}
      >
        <Link href={`/${locale}`} className="flex shrink-0 items-center gap-3" aria-label="Xpert Fintech Ltd. — home">
          {logo}
        </Link>

        <nav aria-label={labels.mainNavigation} className="hidden flex-1 justify-center lg:flex">
          <ul className="flex items-center gap-0.5">
            {links.map((item) => {
              const active = isActive(item);
              const itemClass = cn(
                "relative inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors",
                active || openId === item.id ? "text-fg" : "text-text-secondary hover:text-fg",
                openId === item.id && "bg-fg/[0.06]",
              );
              if (item.children.length === 0) {
                return (
                  <li key={item.id} onMouseEnter={() => setOpenId(null)}>
                    <ItemLink item={item} className={itemClass}>
                      {item.label}
                      {active && <span aria-hidden="true" className="absolute inset-x-4 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />}
                    </ItemLink>
                  </li>
                );
              }
              const panelId = `${panelBase}-${item.id}`;
              return (
                <li key={item.id} onMouseEnter={() => open(item.id)}>
                  <button
                    type="button"
                    className={itemClass}
                    aria-expanded={openId === item.id}
                    aria-controls={panelId}
                    onClick={() => (openId === item.id ? setOpenId(null) : open(item.id))}
                  >
                    {item.label}
                    <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" className={cn("transition-transform duration-300", openId === item.id && "rotate-180")}>
                      <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    {active && <span aria-hidden="true" className="absolute inset-x-4 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />}
                  </button>
                  {openId === item.id && (
                    <div onMouseEnter={() => open(item.id)}>
                      <MegaPanel item={item} id={panelId} overview={labels.overview} onNavigate={() => setOpenId(null)} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle labels={{ toLight: labels.toLight, toDark: labels.toDark }} />
          <LanguageSwitch current={locale} label={labels.language} className="hidden md:inline-flex" />
          {cta?.href && (
            <Link
              href={cta.href}
              className="btn-glow hidden h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white sm:inline-flex"
            >
              {cta.label}
            </Link>
          )}
          <button
            ref={toggleRef}
            type="button"
            className="relative inline-flex size-10 items-center justify-center rounded-full border border-fg/15 bg-fg/[0.04] lg:hidden"
            aria-expanded={menuOpen}
            aria-controls={drawerId}
            aria-label={menuOpen ? labels.closeMenu : labels.menu}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span aria-hidden="true" className={cn("absolute h-px w-4 bg-current transition-transform duration-300", menuOpen ? "rotate-45" : "-translate-y-1")} />
            <span aria-hidden="true" className={cn("absolute h-px w-4 bg-current transition-transform duration-300", menuOpen ? "-rotate-45" : "translate-y-1")} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id={drawerId}
        ref={drawerRef}
        hidden={!menuOpen}
        className="glass-strong fixed inset-x-3 top-20 bottom-3 z-(--z-drawer) overflow-y-auto rounded-3xl p-6 lg:hidden"
      >
        <nav aria-label={labels.mainNavigation}>
          <ul className="flex flex-col">
            {links.map((item, i) => (
              <li key={item.id} className="mobile-in border-b border-fg/[0.07] py-1" style={{ "--d": i } as CSSProperties}>
                {item.children.length === 0 ? (
                  <ItemLink item={item} onNavigate={() => setMenuOpen(false)} className="flex items-center justify-between py-3 font-display text-2xl font-semibold">
                    {item.label}
                    <span aria-hidden="true" className="text-text-secondary">→</span>
                  </ItemLink>
                ) : (
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-display text-2xl font-semibold">
                      {item.label}
                      <span aria-hidden="true" className="text-text-secondary transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <ul className="flex flex-col gap-1 pb-3">
                      {item.href && (
                        <li>
                          <ItemLink item={{ ...item, children: [] }} onNavigate={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 text-cyan-300">
                            {labels.overview} →
                          </ItemLink>
                        </li>
                      )}
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <ItemLink item={child} onNavigate={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-text-secondary hover:bg-fg/5 hover:text-fg">
                            <Icon name={iconFor(child.href)} className="size-4 text-brand-sky" />
                            {child.label}
                          </ItemLink>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-8 flex flex-col gap-4">
          {cta?.href && (
            <Link href={cta.href} onClick={() => setMenuOpen(false)} className="btn-glow flex h-12 items-center justify-center rounded-full text-sm font-semibold text-white">
              {cta.label}
            </Link>
          )}
          <div className="flex items-center gap-3">
            <LanguageSwitch current={locale} label={labels.language} />
          </div>
        </div>
      </div>
    </header>
  );
}
