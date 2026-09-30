"use server";

import { redirect } from "next/navigation";
import { verify } from "@node-rs/argon2";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { createSession, destroySession, requestMeta } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";

export type LoginState = { error?: string; email?: string };

const MAX_FAILURES = 5;
const LOCK_MINUTES = 15;
// Same message for every failure, so the form never reveals which emails exist.
const GENERIC_ERROR = "Email or password is incorrect.";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: GENERIC_ERROR, email };

  const { ip } = await requestMeta();
  const limit = rateLimit(`login:${ip ?? "unknown"}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return { error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minutes.`, email };
  }

  const admin = await db.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (!admin || !admin.isActive) return { error: GENERIC_ERROR, email };

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return { error: `This account is locked for a few minutes after repeated failed logins.`, email };
  }

  const ok = await verify(admin.passwordHash, parsed.data.password).catch(() => false);
  if (!ok) {
    const failures = admin.failedLoginCount + 1;
    await db.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLoginCount: failures >= MAX_FAILURES ? 0 : failures,
        lockedUntil: failures >= MAX_FAILURES ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
      },
    });
    return { error: GENERIC_ERROR, email };
  }

  await db.adminUser.update({
    where: { id: admin.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await createSession(admin.id);

  // Only allow redirects back into the admin area.
  const next = parsed.data.next;
  redirect(next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
