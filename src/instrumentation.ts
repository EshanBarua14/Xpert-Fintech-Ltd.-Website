/**
 * Runs once when the server starts. Refuses to start a production server with
 * a misconfigured .env (see src/lib/env/check.ts).
 *
 * Node-only code lives in ./instrumentation-node: this file is also compiled
 * for the Edge runtime, where node: modules (crypto, the database) do not exist.
 * The NEXT_RUNTIME check is replaced at build time, so the Edge build drops the import.
 */
export async function register() {
  // Not during `next build`: the build machine does not need the live secrets.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { onNodeStart } = await import("./instrumentation-node");
    await onNodeStart();
  }
}
