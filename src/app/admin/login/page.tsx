import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { getCurrentAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentAdmin()) redirect("/admin");
  const { next } = await searchParams;

  return (
    <main className="admin-shell relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink-950 px-4 py-16">
      {/* Soft brand glow behind the card */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_-10%,rgb(42_95_174/0.35),transparent_70%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo height={64} priority />
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold tracking-[0.18em] text-brand-sky uppercase">Xpert Fintech Ltd.</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Xpert Fintech Web App Admin</h1>
            <p className="text-sm text-text-secondary">Sign in to manage the website&apos;s content, leads and settings.</p>
          </div>
        </div>
        <div className="admin-card p-7 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.6)]">
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-text-secondary">
          Authorised staff only. Sign-ins are recorded; two-factor sign-in is recommended.
          <br />© {new Date().getFullYear()} Xpert Fintech Ltd.
        </p>
      </div>
    </main>
  );
}
