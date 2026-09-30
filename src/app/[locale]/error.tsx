"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import en from "@/messages/en.json";
import bn from "@/messages/bn.json";
import { Button, buttonClasses } from "@/components/ui/Button";
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
    <Container className="flex flex-col items-start gap-6 py-24 md:py-32">
      <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{t.errorTitle}</h1>
      <p className="max-w-xl text-lg text-text-secondary">{t.errorBody}</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>{t.tryAgain}</Button>
        <Link href={`/${locale}`} className={buttonClasses({ variant: "secondary" })}>
          {t.backHome}
        </Link>
      </div>
    </Container>
  );
}
