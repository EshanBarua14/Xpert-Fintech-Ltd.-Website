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
    <main className="flex min-h-dvh items-center justify-center bg-ink-950 px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo height={72} priority />
          <h1 className="font-display text-2xl font-semibold">Xpert Admin</h1>
          <p className="text-sm text-text-secondary">Sign in to manage the website.</p>
        </div>
        <div className="rounded-card border border-fg/10 bg-navy-900 p-6">
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
