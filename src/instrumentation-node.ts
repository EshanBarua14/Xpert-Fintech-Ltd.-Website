/**
 * Start-up work that needs Node.js (database, crypto). Loaded only by the
 * Node.js runtime from src/instrumentation.ts, never compiled for the Edge runtime.
 */
import { checkEnv, reportEnv } from "./lib/env/check";

export async function onNodeStart() {
  reportEnv(checkEnv());
  // Pre-launch reminder: stand-in leadership profiles still on the website.
  try {
    const { db } = await import("./lib/db/client");
    const n = await db.person.count({ where: { isPlaceholder: true, status: "PUBLISHED", deletedAt: null } });
    if (n) console.warn(`\n  ! ${n} placeholder people profile(s) are published. Replace them with the real profiles in Admin → People before launch.\n`);
  } catch {
    /* database not reachable yet: the configuration check above says why */
  }
}
