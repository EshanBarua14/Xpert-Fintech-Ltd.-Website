import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { AdminNav } from "@/components/admin/AdminUi";
import { requireAdmin } from "@/lib/auth/session";
import { logoutAction } from "@/app/admin/auth-actions";

// Admin pages always read fresh data and are never cached.
export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-white/10 bg-ink-950 p-4 lg:w-60 lg:border-r lg:border-b-0">
        <Link href="/admin" className="flex items-center gap-3">
          <Logo height={40} />
          <span className="font-display font-semibold">Xpert Admin</span>
        </Link>
        <AdminNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-white/10 px-4 py-3 text-sm md:px-8">
          <Link href="/en" target="_blank" rel="noopener noreferrer" className="text-brand-sky hover:underline">
            View website ↗
          </Link>
          <Link href="/admin/users" className="text-text-secondary hover:text-text-primary" title={`${admin.email} — change password`}>
            {admin.name}
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="rounded-control border border-white/15 px-3 py-1.5 hover:border-brand-sky">
              Sign out
            </button>
          </form>
        </header>
        <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
