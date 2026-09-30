import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, Container, SectionHeading } from "@/components/ui/Layout";
import { Select, TextArea, TextInput } from "@/components/ui/Field";
import { OrderFlow } from "@/components/diagrams/OrderFlow";
import { Logo } from "@/components/brand/Logo";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

/**
 * Internal review page for the design system (Phase 2). Not linked anywhere,
 * never indexed, and returns 404 when APP_ENV=production.
 */
export const metadata: Metadata = { title: "Design system", robots: { index: false, follow: false } };

const swatches = [
  ["ink-950", "bg-ink-950", "Page background"],
  ["navy-900", "bg-navy-900", "Surfaces"],
  ["navy-800", "bg-navy-800", "Raised surfaces"],
  ["graphite-700", "bg-graphite-700", "Borders, dividers"],
  ["brand-sky", "bg-brand-sky", "Links, data, focus"],
  ["brand-mid", "bg-brand-mid", "Icons, large text"],
  ["brand-royal", "bg-brand-royal", "Primary buttons"],
  ["brand-deep", "bg-brand-deep", "Links on light"],
  ["market-up", "bg-market-up", "Market gains only"],
  ["market-down", "bg-market-down", "Market losses only"],
] as const;

export default async function DesignSystemPage({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.APP_ENV === "production") notFound();
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);

  return (
    <Container className="flex flex-col gap-20 py-16">
      <SectionHeading
        as="h1"
        eyebrow="XPERT NEXUS · Phase 2"
        title="Design system"
        intro="Tokens and components for review. Every colour pair used for text meets WCAG AA contrast."
      />

      <section className="flex flex-col gap-6">
        <SectionHeading title="Logo" intro="Official asset, used as supplied. Only its size changes." />
        <div className="flex flex-wrap items-end gap-10">
          <Logo height={40} />
          <Logo height={64} />
          <div className="rounded-card bg-white p-4">
            <Logo height={64} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading title="Colour" />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {swatches.map(([name, cls, use]) => (
            <li key={name} className="flex flex-col gap-2">
              <span className={`h-16 rounded-card border border-white/10 ${cls}`} />
              <span className="tabular text-xs">{name}</span>
              <span className="text-xs text-text-secondary">{use}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading title="Type" />
        <div className="flex flex-col gap-4">
          <p className="font-display text-6xl font-semibold tracking-tight">The infrastructure behind the market</p>
          <p className="font-display text-4xl font-semibold">Section heading</p>
          <p className="text-lg text-text-secondary">Intro paragraph in the secondary text colour.</p>
          <p>Body text at 16 px for comfortable reading on every screen size.</p>
          <p className="tabular text-2xl">
            Sample 12,345.67 <span className="text-market-up">+1.23%</span>{" "}
            <span className="text-xs text-text-secondary">(not market data)</span>
          </p>
          <p lang="bn" className="font-bangla text-2xl">
            বাংলা লেখা এভাবে দেখাবে
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading title="Buttons and badges" />
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href={`/${locale}/request-demo`}>{t.requestDemo}</ButtonLink>
          <Button variant="secondary">Explore the platform</Button>
          <Button variant="ghost">Read more</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Module</Badge>
          <Badge tone="brand">Platform</Badge>
          <Badge tone="up">+1.2%</Badge>
          <Badge tone="down">−0.6%</Badge>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading title="Cards" />
        <div className="grid gap-6 md:grid-cols-3">
          {["Xpert OMS", "Xpert RMS", "Xpert eKYC"].map((name) => (
            <Card key={name} interactive>
              <Badge tone="brand">Product</Badge>
              <h3 className="mt-4 font-display text-xl font-semibold">{name}</h3>
              <p className="mt-2 text-sm text-text-secondary">Card text comes from Admin → Products.</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading title="Form fields" />
        <div className="grid max-w-2xl gap-5 md:grid-cols-2">
          <TextInput id="ds-name" label="Name" required autoComplete="name" />
          <TextInput id="ds-email" type="email" label="Work email" required hint="Hint text appears here." />
          <Select
            id="ds-product"
            label="Interested product"
            placeholder="Choose a product"
            options={[
              { value: "oms", label: "Xpert Trading Platform (OMS)" },
              { value: "rms", label: "Xpert RMS" },
            ]}
          />
          <TextInput id="ds-phone" label="Phone" error="Enter a phone number with country code." defaultValue="01" />
          <div className="md:col-span-2">
            <TextArea id="ds-message" label="Message" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <OrderFlow
          title={t.orderFlowTitle}
          caption={t.conceptualView}
          steps={[
            { key: "investor", label: "Investor", note: "brokerage client" },
            { key: "app", label: "Branded app", note: "mobile & desktop" },
            { key: "oms", label: "Xpert OMS", note: "order management", highlight: true },
            { key: "rms", label: "RMS", note: "risk checks" },
            { key: "exchange", label: "Exchange link", note: "FIX / API" },
            { key: "dse-cse", label: "DSE / CSE", note: "execution" },
          ]}
        />
      </section>
    </Container>
  );
}
