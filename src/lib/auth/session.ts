import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";

/**
 * Admin sessions.
 *  - The browser holds a random 256-bit token in an httpOnly cookie.
 *  - The database stores only its SHA-256 hash, so a leaked database cannot
 *    be used to log in.
 *  - A session ends after SESSION_IDLE_HOURS without activity (default 12)
 *    or 7 days after login, whichever comes first, or on logout.
 */
export const SESSION_COOKIE = "xpert_admin_session";
const ABSOLUTE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

function idleMs() {
  const hours = Number(process.env.SESSION_IDLE_HOURS ?? 12);
  return (Number.isFinite(hours) && hours > 0 ? hours : 12) * 60 * 60 * 1000;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestMeta() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  return { ip, userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
}

/** Creates a session and sets the cookie. Call only from a server action. */
export async function createSession(adminUserId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const { ip, userAgent } = await requestMeta();
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      adminUserId,
      ip,
      userAgent,
      expiresAt: new Date(now + ABSOLUTE_LIFETIME_MS),
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ABSOLUTE_LIFETIME_MS / 1000,
  });
}

/** Ends the current session on the server and clears the cookie. */
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  jar.delete(SESSION_COOKIE);
}

/** Ends every session of an admin (after a password change or deactivation). */
export async function revokeAllSessions(adminUserId: string) {
  await db.session.updateMany({ where: { adminUserId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export type CurrentAdmin = { id: string; email: string; name: string };

/**
 * The signed-in admin for this request, or null. Cached per request, so
 * layouts, pages and actions can all call it cheaply.
 */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { adminUser: { select: { id: true, email: true, name: true, isActive: true } } },
  });
  const now = Date.now();
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() <= now ||
    session.lastSeenAt.getTime() + idleMs() <= now ||
    !session.adminUser.isActive
  ) {
    return null;
  }

  // Record activity at most every few minutes to keep the idle timer fresh.
  if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date(now) } });
  }
  const { id, email, name } = session.adminUser;
  return { id, email, name };
});

/** Use at the top of every admin page and every admin server action. */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
