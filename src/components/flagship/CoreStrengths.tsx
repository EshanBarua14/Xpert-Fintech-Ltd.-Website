import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { digits } from "@/lib/i18n/digits";
import { cn } from "@/lib/utils/cn";

export type StrengthCard = { icon: string; title: string; body: string };

/**
 * Admin → Home highlights → Core strengths: a card per strength. The first card
 * is the lead (wider on large screens when the count leaves a gap), each card
 * carries its number and icon, and they rise in as the section scrolls in.
 */
export function CoreStrengths({ items, locale }: { items: StrengthCard[]; locale: "en" | "bn" }) {
  if (!items.length) return null;
  // On a three-column grid, 5 or 8 cards leave one empty cell: the first card fills it.
  const leadWide = items.length % 3 === 2;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s, i) => (
        <li
          key={`${s.title}-${i}`}
          data-reveal
          style={{ "--d": i % 3 } as CSSProperties}
          className={cn(
            "strength-card group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-fg/10 bg-navy-900/70 p-6 transition-colors duration-300 hover:border-brand-sky/40 md:p-7",
            i === 0 && leadWide && "lg:col-span-2",
          )}
        >
          <span aria-hidden="true" className="strength-glow pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-brand-sky/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative flex items-center justify-between gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-royal to-brand-sky text-white shadow-lg shadow-brand-royal/20">
              <Icon name={s.icon} className="size-6" />
            </span>
            <span aria-hidden="true" className="font-mono text-sm text-text-secondary tabular-nums">
              {digits(String(i + 1).padStart(2, "0"), locale === "bn")}
            </span>
          </div>
          <div className="relative flex flex-col gap-2">
            <h3 className="font-display text-xl leading-snug font-semibold text-text-primary">{s.title}</h3>
            {s.body && <p className="max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">{s.body}</p>}
          </div>
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-brand-sky via-gold/80 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
        </li>
      ))}
    </ul>
  );
}
