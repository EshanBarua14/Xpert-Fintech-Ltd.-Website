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

console.log("[migrate-on-deploy] applying pending migrations…");
execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
});
console.log("[migrate-on-deploy] done");
