import type { CSSProperties } from "react";
import type { Messages } from "@/lib/i18n/messages";
import { Icon } from "@/components/ui/Icon";
import { Emph } from "@/components/ui/Emph";
import { PrimaryButton } from "@/components/flagship/Sections";

/**
 * "Built around your house. Open to your systems." as a picture of how it fits:
 * the house's own systems on top, secure APIs in the middle, and the Xpert Fintech
 * platform below, set up with the house's brand, rules and features.
 * Text in Admin → Site text (integration* keys); Admin → Design → Home page hides or moves it.
 */
const SYSTEMS: { key: "Website" | "Accounting" | "Crm" | "Bank" | "Payments" | "Alerts"; icon: string }[] = [
  { key: "Website", icon: "globe" },
  { key: "Accounting", icon: "document" },
  { key: "Crm", icon: "users" },
  { key: "Bank", icon: "landmark" },
  { key: "Payments", icon: "exchange" },
  { key: "Alerts", icon: "mail" },
];

const LAYERS: { key: "Brand" | "Rules" | "Features"; icon: string; tone: string }[] = [
  { key: "Brand", icon: "award", tone: "#22bceb" },
  { key: "Rules", icon: "shield", tone: "#f0c66e" },
  { key: "Features", icon: "bolt", tone: "#8fb4ff" },
];

export function IntegrationSection({ t, locale }: { t: Messages; locale: string }) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
      <div className="flex flex-col gap-6">
        <h2 className="font-display text-4xl leading-[1.08] font-semibold text-balance text-text-primary md:text-5xl [&_.emph]:table">
          <Emph text={t.integrationTitle} />
        </h2>
        <p className="max-w-xl text-lg leading-relaxed text-pretty text-text-secondary [hyphens:none] [text-align:left]">{t.integrationBody}</p>
        <div>
          <PrimaryButton href={`/${locale}/request-demo`}>{t.integrationCta} →</PrimaryButton>
        </div>
      </div>

      {/* The picture: your systems → secure APIs → the platform, set up for your house. */}
      <div className="integration-map relative overflow-hidden rounded-[2rem] border border-fg/[0.08] bg-navy-900/70 p-5 backdrop-blur-md light:bg-white/90 md:p-8" role="img" aria-label={`${t.integrationSystemsTitle}: ${SYSTEMS.map((s) => t[`integrationSys${s.key}`]).join(", ")}. ${t.integrationApiLabel}. ${t.integrationPlatformLabel}: ${LAYERS.map((l) => t[`integration${l.key}Title`]).join(", ")}.`}>
        <p className="mb-4 text-center text-xs font-semibold tracking-[0.18em] text-text-secondary uppercase">{t.integrationSystemsTitle}</p>
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {SYSTEMS.map((s, i) => (
            <li key={s.key} data-reveal style={{ "--d": i } as CSSProperties} className="flex flex-col items-center">
              <span className="flex h-full min-h-[5.25rem] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-fg/10 bg-fg/[0.04] px-2 py-3 text-center light:bg-white">
                <Icon name={s.icon} className="size-5 text-brand-sky" />
                <span className="text-[12px] leading-tight font-semibold text-text-primary">{t[`integrationSys${s.key}`]}</span>
              </span>
              {/* each system's line down to the shared bus */}
              <span aria-hidden="true" className="integration-wire h-5 w-px" />
            </li>
          ))}
        </ul>
        {/* the bus joining every system, then one line into the API */}
        <span aria-hidden="true" className="integration-bus mx-[8.33%] block h-px" />
        <span aria-hidden="true" className="integration-wire mx-auto block h-5 w-px" />

        <div className="integration-api relative mx-auto flex items-center justify-center gap-2 rounded-full border border-brand-sky/40 bg-brand-sky/10 px-5 py-2 text-sm font-semibold text-brand-sky">
          <Icon name="lock" className="size-4" />
          {t.integrationApiLabel}
        </div>
        <span aria-hidden="true" className="integration-wire mx-auto block h-8 w-px" />

        <div className="rounded-3xl border border-fg/10 bg-linear-to-b from-brand-royal/25 to-transparent p-4 light:from-brand-royal/10 md:p-5">
          <p className="mb-4 flex items-center justify-center gap-2 text-center text-sm font-semibold text-text-primary">
            <span className="size-2 rounded-full bg-brand-sky shadow-[0_0_10px_rgb(34_188_235/0.9)]" />
            {t.integrationPlatformLabel}
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {LAYERS.map((l, i) => (
              <li key={l.key} data-reveal style={{ "--d": i + 6 } as CSSProperties} className="flex flex-col gap-2 rounded-2xl border border-fg/10 bg-fg/[0.04] p-4 light:bg-white">
                <span className="flex size-9 items-center justify-center rounded-xl" style={{ background: `${l.tone}22`, color: l.tone }}>
                  <Icon name={l.icon} className="size-4" />
                </span>
                <span className="font-display text-lg leading-tight font-semibold text-text-primary">{t[`integration${l.key}Title`]}</span>
                <span className="text-xs leading-relaxed text-text-secondary [hyphens:none] [text-align:left]">{t[`integration${l.key}Body`]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
