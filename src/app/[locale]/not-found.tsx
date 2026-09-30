"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import en from "@/messages/en.json";
import bn from "@/messages/bn.json";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";

/** Localized 404 inside the public layout (header and footer stay visible). */
export default function NotFound() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === "bn" ? "bn" : "en";
  const t = locale === "bn" ? bn : en;
  return (
    <Container className="flex flex-col items-start gap-6 py-24 md:py-32">
      <p className="tabular text-sm tracking-[0.2em] text-brand-sky">404</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{t.notFoundTitle}</h1>
      <p className="max-w-xl text-lg text-text-secondary">{t.notFoundBody}</p>
      <Link href={`/${locale}`} className={buttonClasses({})}>
        {t.backHome}
      </Link>
    </Container>
  );
}
