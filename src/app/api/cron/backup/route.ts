import { NextResponse } from "next/server";
import { backupIfDue } from "@/lib/admin/backup";

/**
 * Daily automatic backup, called by Vercel's scheduled job (vercel.json).
 * Vercel sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 });
  await backupIfDue();
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
