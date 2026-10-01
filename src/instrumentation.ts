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
}
