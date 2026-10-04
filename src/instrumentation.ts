/**
 * Runs once when the server starts. Refuses to start a production server with
 * a misconfigured .env (see src/lib/env/check.ts).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Not during `next build`: the build machine does not need the live secrets.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { checkEnv, reportEnv } = await import("./lib/env/check");
  reportEnv(checkEnv());
  // Pre-launch reminder: stand-in leadership profiles still on the website.
  try {
    const { db } = await import("./lib/db/client");
    const n = await db.person.count({ where: { isPlaceholder: true, status: "PUBLISHED", deletedAt: null } });
    if (n) console.warn(`\n  ! ${n} placeholder people profile(s) are published. Replace them with the real profiles in Admin → People before launch.\n`);
  } catch {
    /* database not reachable yet: the env check above already says why */
  }
}
