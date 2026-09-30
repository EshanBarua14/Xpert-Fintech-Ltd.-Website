"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import en from "@/messages/en.json";
import bn from "@/messages/bn.json";
import { Container } from "@/components/ui/Layout";

/** Localized error screen. Technical details go to the server log only. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === "bn" ? "bn" : "en";
  const t = locale === "bn" ? bn : en;

  useEffect(() => {
    console.error(error.digest ?? error);
  }, [error]);

  return (
    <section className="relative -mt-20 overflow-hidden pt-20 md:-mt-24 md:pt-24">
      <div className="aurora opacity-70" />
      <div className="grid-fade pointer-events-none absolute inset-0" />
      <Container className="relative flex min-h-[70svh] flex-col items-start justify-center gap-6 py-24 md:py-32">
      <h1 className="text-gradient font-display text-4xl font-semibold tracking-[-0.035em] md:text-6xl">{t.errorTitle}</h1>
      <p className="max-w-xl text-lg text-text-secondary">{t.errorBody}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn-glow inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold text-white">
          {t.tryAgain}
        </button>
        <Link href={`/${locale}`} className="inline-flex h-12 items-center rounded-full border border-white/15 px-6 text-sm font-semibold hover:border-brand-sky/60">
          {t.backHome}
        </Link>
      </div>
      </Container>
    </section>
  );
}
