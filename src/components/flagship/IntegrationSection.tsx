import type { CSSProperties } from "react";
import type { Messages } from "@/lib/i18n/messages";
import { Icon } from "@/components/ui/Icon";
import { Emph } from "@/components/ui/Emph";
import { PrimaryButton } from "@/components/flagship/Sections";

/**
 * "Built around your house. Open to your systems.": how Xpert Fintech is set up
 * for each brokerage (brand, rules, systems, features). Text in Admin → Site text
 * (integration* keys); Admin → Design → Home page hides or moves the section.
 */
const POINTS: { key: "Brand" | "Rules" | "Systems" | "Features"; icon: string }[] = [
  { key: "Brand", icon: "award" },
  { key: "Rules", icon: "shield" },
  { key: "Systems", icon: "network" },
  { key: "Features", icon: "bolt" },
];

export function IntegrationSection({ t, locale }: { t: Messages; locale: string }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div className="flex flex-col gap-6">
        <h2 className="font-display text-4xl leading-[1.08] font-semibold text-balance text-text-primary md:text-5xl">
          <Emph text={t.integrationTitle} />
        </h2>
        <p className="max-w-xl text-lg leading-relaxed text-text-secondary">{t.integrationBody}</p>
        <div className="flex flex-col items-start gap-3">
          <PrimaryButton href={`/${locale}/request-demo`}>{t.integrationCta} →</PrimaryButton>
          {t.integrationNote && <p className="text-sm text-text-secondary">{t.integrationNote}</p>}
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {POINTS.map((p, i) => (
          <li key={p.key} data-reveal style={{ "--d": i } as CSSProperties} className="flex flex-col gap-4 rounded-3xl border border-fg/[0.08] bg-fg/[0.02] p-6">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-sky/10 text-brand-sky">
              <Icon name={p.icon} className="size-5" />
            </span>
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-xl leading-snug font-semibold text-text-primary">{t[`integration${p.key}Title`]}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{t[`integration${p.key}Body`]}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
