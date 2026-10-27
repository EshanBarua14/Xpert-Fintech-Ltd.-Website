/*
 * Start file for the Namecheap server (cPanel "Setup Node.js App" → Application startup file: app.js,
 * or PM2 on a VPS via ecosystem.config.cjs). It loads the site's settings, then starts Next.js's
 * standalone server (server.js, built by .github/workflows/deploy-namecheap.yml).
 *
 * Settings come from, in order (the first one wins for each name):
 *   1. variables set in cPanel's Node.js app screen or the shell,
 *   2. the file named by XFL_ENV_FILE, else ~/xpertfintech.env (kept outside the app folder,
 *      so a new release never overwrites it; copy deploy/server.env.example to start it).
 */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const file = process.env.XFL_ENV_FILE || path.join(os.homedir(), "xpertfintech.env");
if (fs.existsSync(file)) {
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, "");
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
} else {
  console.warn(`[xfl] settings file not found: ${file} (using only the variables already set)`);
}

process.env.NODE_ENV = "production";
process.env.APP_ENV = process.env.APP_ENV || "production";
// Next's server reads HOSTNAME; shells often set it to the machine's name, so set it here.
process.env.HOSTNAME = process.env.BIND_HOST || "127.0.0.1";
process.env.PORT = process.env.PORT || "3000";
process.chdir(__dirname);

require("./server.js");
