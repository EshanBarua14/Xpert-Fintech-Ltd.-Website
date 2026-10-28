import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { formatDhaka } from "@/components/admin/AdminList";
import { AdminUsersTable, ChangePasswordForm, CreateAdminForm, TwoFactorPanel } from "@/components/admin/AccountForms";
import { hasServerSecret } from "@/lib/auth/totp";

export default async function UsersPage() {
  const me = await requireAdmin();
  const admins = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  const now = new Date();

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Users and roles</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Admins create, edit and delete content and manage users and backups. Editors edit existing content only.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold">My password</h2>
        <ChangePasswordForm />
      </section>

      <section className="flex flex-col gap-4 border-t border-fg/10 pt-8">
        <h2 className="font-display text-xl font-semibold">My two-factor sign-in</h2>
        <TwoFactorPanel enabled={Boolean(admins.find((a) => a.id === me.id)?.totpEnabled)} serverReady={hasServerSecret()} />
      </section>

      {me.role === "ADMIN" && (
      <>
      <section className="flex flex-col gap-4 border-t border-fg/10 pt-8">
        <h2 className="font-display text-xl font-semibold">Accounts</h2>
        <AdminUsersTable
          rows={admins.map((a) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            role: a.role,
            isActive: a.isActive,
            isSelf: a.id === me.id,
            lastLogin: formatDhaka(a.lastLoginAt),
            locked: Boolean(a.lockedUntil && a.lockedUntil > now),
            twoFactor: a.totpEnabled,
          }))}
        />
      </section>

      <section className="flex flex-col gap-4 border-t border-fg/10 pt-8">
        <h2 className="font-display text-xl font-semibold">Add a user</h2>
        <CreateAdminForm />
      </section>
      </>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
