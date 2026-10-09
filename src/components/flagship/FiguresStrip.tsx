import type { Figure } from "@/lib/content/figures";
import type { Messages } from "@/lib/i18n/messages";
import { digits } from "@/lib/i18n/digits";
import { ContentSlot } from "@/components/ui/ContentSlot";

/**
 * "In numbers": the figures entered in Admin → Figures, each with its source
 * and date. Outside the live site, empty slots show what to add until then.
 */
export function FiguresStrip({ figures, t, locale, slots }: { figures: Figure[]; t: Messages; locale: "en" | "bn"; slots: boolean }) {
  const date = (d: string) =>
    new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
  if (!figures.length) {
    if (!slots) return null;
    return (
      <ul className="grid gap-4 sm:grid-cols-3">
        {[t.figureSlotOrders, t.figureSlotYears, t.figureSlotMembers].map((title) => (
          <li key={title}>
            <ContentSlot kind="figure" locale={locale} title={title} adminHref="/admin/figures" />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <dl className="grid gap-px overflow-hidden rounded-3xl border border-fg/[0.08] bg-fg/[0.08] sm:grid-cols-2 lg:grid-cols-3">
      {figures.map((f) => (
        <div key={`${f.value}-${f.labelEn}`} data-reveal className="flex flex-col gap-2 bg-ink-950 p-6 md:p-8">
          <dd className="order-2 font-display text-[clamp(2.25rem,4vw,3.25rem)] leading-none font-semibold tracking-tight text-text-primary">{digits(f.value, locale === "bn")}</dd>
          <dt className="order-1 text-sm font-semibold text-text-secondary">{(locale === "bn" && f.labelBn) || f.labelEn}</dt>
          <span className="order-3 text-xs text-text-secondary">
            {t.marketSource}: {f.source}
            {f.asOf ? ` (${date(f.asOf)})` : ""}
          </span>
        </div>
      ))}
    </dl>
  );
}
