import { db } from "@/lib/db/client";
import { getCurrentAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * New, unhandled leads and job applications, for the admin's live badges.
 * Signed-in admins only; never cached.
 */
export async function GET() {
  const admin = await getCurrentAdmin().catch(() => null);
  if (!admin) return Response.json({ error: "Sign in" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const [leads, applications, latestLead, latestApplication] = await Promise.all([
    db.lead.count({ where: { status: "NEW", deletedAt: null } }),
    db.careerApplication.count({ where: { status: "NEW", deletedAt: null } }),
    db.lead.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, organization: true, createdAt: true } }),
    db.careerApplication.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, createdAt: true } }),
  ]);
  return Response.json(
    { leads, applications, latestLead, latestApplication },
    { headers: { "Cache-Control": "no-store" } },
  );
}
