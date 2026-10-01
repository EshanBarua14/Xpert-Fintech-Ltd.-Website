import { db } from "@/lib/db/client";

export const dynamic = "force-dynamic";

const started = Date.now();

/**
 * Health check for uptime monitors and Docker: 200 when the site and the
 * database answer, 503 otherwise. Reveals nothing sensitive.
 */
export async function GET() {
  let database: "ok" | "unavailable" = "ok";
  try {
    await Promise.race([db.$queryRaw`SELECT 1`, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000))]);
  } catch {
    database = "unavailable";
  }
  const ok = database === "ok";
  return Response.json(
    { status: ok ? "ok" : "degraded", database, uptimeSeconds: Math.round((Date.now() - started) / 1000), time: new Date().toISOString() },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
