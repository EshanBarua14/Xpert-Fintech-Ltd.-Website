/**
 * Start-up configuration check (run from src/instrumentation.ts).
 * In production a problem stops the server with a clear list of what to fix;
 * in development the same problems are printed as warnings.
 */
export type EnvIssue = { key: string; problem: string; fatal: boolean };

export function checkEnv(env: NodeJS.ProcessEnv = process.env): EnvIssue[] {
  const prod = env.NODE_ENV === "production" || env.APP_ENV === "production";
  const issues: EnvIssue[] = [];
  const add = (key: string, problem: string, fatalInProd = true) => issues.push({ key, problem, fatal: prod && fatalInProd });

  // Database
  if (!env.DATABASE_URL) add("DATABASE_URL", "is missing. Set the PostgreSQL connection string.");
  else if (!/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) add("DATABASE_URL", "must start with postgresql://");

  // Public address
  const site = env.NEXT_PUBLIC_SITE_URL;
  if (!site) add("NEXT_PUBLIC_SITE_URL", "is missing. Set the public address, e.g. https://www.xpertfintech.com");
  else {
    try {
      const u = new URL(site);
      if (prod && u.protocol !== "https:") add("NEXT_PUBLIC_SITE_URL", "must use https:// in production.");
      if (prod && /localhost|127\.0\.0\.1/.test(u.hostname)) add("NEXT_PUBLIC_SITE_URL", "still points to localhost.");
      if (site.endsWith("/")) add("NEXT_PUBLIC_SITE_URL", "must not end with a slash.", false);
    } catch {
      add("NEXT_PUBLIC_SITE_URL", "is not a valid address.");
    }
  }

  // Sessions and two-factor secrets
  const secret = env.SESSION_SECRET ?? "";
  if (secret.length < 32) add("SESSION_SECRET", "must be at least 32 random characters (generate with: openssl rand -base64 48).");

  // Seed admin password must not be left in a production environment
  if (prod && env.SEED_ADMIN_PASSWORD) add("SEED_ADMIN_PASSWORD", "should be removed from the production .env after the first admin is created.", false);

  // File storage
  const storage = (env.STORAGE_DRIVER ?? "local").toLowerCase();
  if (!["local", "s3"].includes(storage)) add("STORAGE_DRIVER", "must be local or s3.");
  if (storage === "s3") add("STORAGE_DRIVER", "s3 is not available yet. Use local and back up the storage folder.");
  if (prod && storage === "local") add("STORAGE_DRIVER", "is local: uploads are stored on this server's disk. Back up the storage folder (see docs/OPERATIONS.md).", false);

  // Market data
  const mode = (env.MARKET_DATA_MODE ?? "none").toLowerCase();
  if (!["none", "exchange", "licensed", "demo"].includes(mode)) add("MARKET_DATA_MODE", "must be none, exchange, licensed or demo.");
  if (mode === "licensed" && !env.MARKET_DATA_API_URL) add("MARKET_DATA_API_URL", "is required when MARKET_DATA_MODE=licensed.");
  if (prod && mode === "demo" && env.ALLOW_DEMO_MARKET_DATA !== "true") add("MARKET_DATA_MODE", "is demo. Generated prices must never be shown on the live site.");

  // Spam protection: both keys or neither
  if (!!env.TURNSTILE_SITE_KEY !== !!env.TURNSTILE_SECRET_KEY) add("TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY", "set both or neither.", false);

  return issues;
}

export function reportEnv(issues: EnvIssue[]) {
  if (!issues.length) return;
  const fatal = issues.filter((i) => i.fatal);
  const lines = issues.map((i) => `  ${i.fatal ? "✖" : "!"} ${i.key} ${i.problem}`);
  const header = fatal.length ? "Configuration problems — the server will not start until these are fixed:" : "Configuration warnings:";
  console[fatal.length ? "error" : "warn"](`\n${header}\n${lines.join("\n")}\n`);
  if (fatal.length) throw new Error(`Invalid configuration (${fatal.length} problem${fatal.length > 1 ? "s" : ""}). See the list above.`);
}
