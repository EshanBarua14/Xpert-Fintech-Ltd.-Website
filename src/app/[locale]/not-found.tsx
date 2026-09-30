"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import en from "@/messages/en.json";
import bn from "@/messages/bn.json";
import { Container } from "@/components/ui/Layout";

/** Localized 404 inside the public layout (header and footer stay visible). */
export default function NotFound() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === "bn" ? "bn" : "en";
  const t = locale === "bn" ? bn : en;
  return (
    <section className="relative -mt-20 overflow-hidden pt-20 md:-mt-24 md:pt-24">
      <div className="aurora opacity-70" />
      <div className="grid-fade pointer-events-none absolute inset-0" />
      <Container className="relative flex min-h-[70svh] flex-col items-start justify-center gap-6 py-24 md:py-32">
      <p className="text-gradient-brand font-display text-8xl font-semibold tracking-tighter md:text-9xl">404</p>
      <h1 className="text-gradient font-display text-4xl font-semibold tracking-[-0.035em] md:text-6xl">{t.notFoundTitle}</h1>
      <p className="max-w-xl text-lg text-text-secondary">{t.notFoundBody}</p>
      <Link href={`/${locale}`} className="btn-glow inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold text-white">
        {t.backHome}
      </Link>
      </Container>
    </section>
  );
}
