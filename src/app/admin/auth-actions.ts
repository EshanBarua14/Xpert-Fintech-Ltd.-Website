"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verify } from "@node-rs/argon2";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { createSession, destroySession, requestMeta } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { consumeStep, decryptSecret, hasServerSecret, sign, unsign, verifyTotp } from "@/lib/auth/totp";

export type LoginState = { error?: string; email?: string; step?: "password" | "code" };

// Set after a correct password when the account uses two-factor sign-in.
const PENDING_COOKIE = "xpert_admin_2fa";
const PENDING_MINUTES = 5;

/** Only allow redirects back into the admin area. */
function safeNext(next: string | undefined | null) {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

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

  await db.adminUser.update({ where: { id: admin.id }, data: { failedLoginCount: 0, lockedUntil: null } });

  // Two-factor sign-in: remember "password OK" for 5 minutes and ask for the code.
  if (admin.totpEnabled && admin.totpSecret) {
    if (!hasServerSecret()) {
      return { error: "Two-factor sign-in is not configured on this server (SESSION_SECRET is missing).", email };
    }
    const payload = Buffer.from(
      JSON.stringify({ a: admin.id, e: Date.now() + PENDING_MINUTES * 60 * 1000, n: safeNext(parsed.data.next) }),
    ).toString("base64url");
    const jar = await cookies();
    jar.set(PENDING_COOKIE, sign(payload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/admin",
      maxAge: PENDING_MINUTES * 60,
    });
    return { step: "code", email };
  }

  await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await createSession(admin.id);
  redirect(safeNext(parsed.data.next));
}

/** Second step of sign-in: the 6-digit code from the authenticator app. */
export async function verifyLoginCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const jar = await cookies();
  const expired: LoginState = { step: "password", error: "Your sign-in timed out. Enter your email and password again." };
  const raw = unsign(jar.get(PENDING_COOKIE)?.value);
  if (!raw) return expired;

  let pending: { a: string; e: number; n: string };
  try {
    pending = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return expired;
  }
  if (typeof pending.a !== "string" || typeof pending.e !== "number" || pending.e < Date.now()) {
    jar.delete({ name: PENDING_COOKIE, path: "/admin" });
    return expired;
  }

  // 5 wrong codes → start again from the password.
  if (!rateLimit(`totp:${pending.a}`, 5, PENDING_MINUTES * 60 * 1000).ok) {
    jar.delete({ name: PENDING_COOKIE, path: "/admin" });
    return { step: "password", error: "Too many wrong codes. Sign in again in a few minutes." };
  }

  const admin = await db.adminUser.findUnique({ where: { id: pending.a } });
  if (!admin || !admin.isActive || !admin.totpEnabled) return expired;
  const secret = decryptSecret(admin.totpSecret);
  if (!secret) {
    return { step: "code", error: "Two-factor sign-in cannot be checked on this server. Ask another admin to turn it off for your account." };
  }

  const step = verifyTotp(secret, String(formData.get("code") ?? ""));
  if (step === null || !consumeStep(admin.id, step)) {
    return { step: "code", error: "That code is not correct. Use the newest code from your app." };
  }

  jar.delete({ name: PENDING_COOKIE, path: "/admin" });
  await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await createSession(admin.id);
  redirect(safeNext(pending.n));
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
