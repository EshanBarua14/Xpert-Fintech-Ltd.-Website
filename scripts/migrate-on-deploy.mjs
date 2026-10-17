// Runs `prisma migrate deploy` before a Vercel *production* build, so the
// database always has the columns the new code expects (no more P2022
// "column does not exist" 500s after a push).
//
// - Only when VERCEL_ENV=production. Preview builds, the ci/build-check
//   Action and local builds skip it, so they never touch the live database.
// - A failed migration fails the build: Vercel keeps serving the previous
//   deployment instead of shipping code the database cannot serve.
// - Neon: migrations need a direct (non-pooled) connection for Prisma's
//   advisory lock. Uses DIRECT_URL if set, otherwise strips "-pooler" from a
//   Neon DATABASE_URL host.
import { execSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log(`[migrate-on-deploy] skipped (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"})`);
  process.exit(0);
}

const pooled = process.env.DATABASE_URL;
if (!pooled) {
  console.error("[migrate-on-deploy] DATABASE_URL is not set for the Production build. Enable it for builds in Vercel → Settings → Environment Variables.");
  process.exit(1);
}

let url = process.env.DIRECT_URL || pooled;
if (!process.env.DIRECT_URL) {
  try {
    const u = new URL(pooled);
    if (u.hostname.endsWith(".neon.tech") && u.hostname.includes("-pooler")) {
      u.hostname = u.hostname.replace("-pooler", "");
      url = u.toString();
    }
  } catch {
    /* leave as is; prisma will report a bad URL */
  }
}

// Another `migrate deploy` (e.g. one run by hand at the same moment) holds
// Prisma's advisory lock and makes this one time out (P1002). Migrations are
// idempotent, so wait and retry a few times before failing the build.
const waits = [0, 20, 40, 60]; // seconds before each attempt
for (let i = 0; i < waits.length; i++) {
  if (waits[i]) {
    console.log(`[migrate-on-deploy] retrying in ${waits[i]}s (attempt ${i + 1}/${waits.length})…`);
    await new Promise((r) => setTimeout(r, waits[i] * 1000));
  } else {
    console.log("[migrate-on-deploy] applying pending migrations…");
  }
  try {
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url },
    });
    console.log("[migrate-on-deploy] done");
    process.exit(0);
  } catch {
    /* logged by prisma above */
  }
}
console.error(
  "[migrate-on-deploy] failed. If the error is P1002 (advisory lock), a stuck session holds the lock: " +
    "in the Neon SQL editor run SELECT pid, state, query_start FROM pg_stat_activity WHERE pid IN " +
    "(SELECT pid FROM pg_locks WHERE locktype = 'advisory'); then SELECT pg_terminate_backend(<pid>); and redeploy.",
);
process.exit(1);
