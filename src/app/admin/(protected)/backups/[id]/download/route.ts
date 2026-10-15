import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/** Downloads a backup as a .json.gz file (admins only). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return new NextResponse("Sign in first.", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse("Not found", { status: 404 });
  const row = await db.backup.findUnique({ where: { id } });
  if (!row) return new NextResponse("Not found", { status: 404 });
  const stamp = row.createdAt.toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return new NextResponse(new Uint8Array(row.data), {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="xpert-website-backup-${stamp}.json.gz"`,
      "Cache-Control": "no-store",
    },
  });
}
