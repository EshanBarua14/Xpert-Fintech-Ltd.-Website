/**
 * One-time setup for live market data, the market-share API and email alerts.
 *
 *   npm run setup            asks a few questions (press Enter to accept or skip)
 *   npm run setup -- --yes   no questions: market data on, token generated, email skipped
 *
 * What it does:
 *  - .env: MARKET_DATA_MODE=exchange, a MARKET_SHARE_API_TOKEN (generated once,
 *    never replaced), and the SMTP settings you enter. Other lines are kept.
 *    A backup is written to .env.backup first.
 *  - Database: switches on "Show market data on the website" (Admin → Market data).
 *  - Admin → Settings: the addresses that receive new-lead emails, if you give any.
 */
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline";
import { PrismaClient } from "@prisma/client";

const ENV = path.resolve(process.cwd(), ".env");
const YES = process.argv.includes("--yes") || process.argv.includes("-y");

// ── Questions (one reader, works in Git Bash and when piped) ─────────────────
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
const lines: string[] = [];
const waiting: ((l: string) => void)[] = [];
rl.on("line", (l) => {
  const w = waiting.shift();
  if (w) w(l);
  else lines.push(l);
});
let hidden = false;
(rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
  if (!hidden) process.stdout.write(s);
};
async function ask(q: string, def = "", secret = false): Promise<string> {
  if (YES) return def;
  hidden = false;
  process.stdout.write(def && !secret ? `${q} [${def}]: ` : `${q}: `);
  hidden = secret;
  const got = lines.shift() ?? (await new Promise<string>((r) => waiting.push(r)));
  if (secret) process.stdout.write("\n");
  hidden = false;
  return got.trim() || def;
}

// ── .env editing: replace KEY=… in place, or append; keep everything else ─────
function readEnv(): string {
  if (fs.existsSync(ENV)) return fs.readFileSync(ENV, "utf8");
  const example = path.resolve(process.cwd(), ".env.example");
  return fs.existsSync(example) ? fs.readFileSync(example, "utf8") : "";
}
function getVar(text: string, key: string): string {
  const m = new RegExp(`^${key}=(.*)$`, "m").exec(text);
  return m ? m[1]!.replace(/^"(.*)"$/, "$1").trim() : "";
}
function setVar(text: string, key: string, value: string): string {
  const quoted = /[\s#"<>]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
  const line = `${key}=${quoted}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  return re.test(text) ? text.replace(re, line) : `${text.replace(/\s*$/, "")}\n${line}\n`;
}

async function main() {
  console.log("\nXpert Fintech website setup\n");
  let env = readEnv();
  if (fs.existsSync(ENV)) fs.copyFileSync(ENV, `${ENV}.backup`);

  // 1. Market data
  const mode = (await ask("Market data source (exchange = DSE/CSE public pages, none = off)", getVar(env, "MARKET_DATA_MODE") === "licensed" ? "licensed" : "exchange")).toLowerCase();
  env = setVar(env, "MARKET_DATA_MODE", ["exchange", "licensed", "none"].includes(mode) ? mode : "exchange");

  // 2. Market-share API token (kept if one exists, so existing integrations keep working)
  if (getVar(env, "MARKET_SHARE_API_TOKEN").length < 24) {
    env = setVar(env, "MARKET_SHARE_API_TOKEN", randomBytes(24).toString("hex"));
    console.log("✔ Generated MARKET_SHARE_API_TOKEN (give it to whoever connects the OMS end-of-day job).");
  } else {
    console.log("✔ MARKET_SHARE_API_TOKEN already set; kept.");
  }

  // 3. Email alerts (optional)
  const host = await ask("SMTP server for email alerts, e.g. smtp.office365.com (Enter to skip)", getVar(env, "SMTP_HOST"));
  let alertTo = "";
  if (host) {
    const port = await ask("SMTP port (587 or 465)", getVar(env, "SMTP_PORT") || "587");
    const user = await ask("SMTP username (usually the sending email address)", getVar(env, "SMTP_USER"));
    const pass = await ask("SMTP password (typing is hidden; Enter keeps the current one)", "", true);
    const from = await ask("Send emails from", getVar(env, "MAIL_FROM") || (user ? `Xpert Fintech <${user}>` : "Xpert Fintech <alerts@xpertfintech.com>"));
    alertTo = await ask("Who receives new-lead emails (comma-separated)", getVar(env, "LEAD_ALERT_EMAILS") || "eshan@xpertfintech.com");
    env = setVar(env, "SMTP_HOST", host);
    env = setVar(env, "SMTP_PORT", port);
    env = setVar(env, "SMTP_SECURE", port === "465" ? "true" : "false");
    env = setVar(env, "SMTP_USER", user);
    if (pass) env = setVar(env, "SMTP_PASSWORD", pass);
    env = setVar(env, "MAIL_FROM", from);
    env = setVar(env, "LEAD_ALERT_EMAILS", alertTo);
    console.log("✔ Email settings saved.");
  } else {
    console.log("• Email alerts skipped (run `npm run setup` again any time).");
  }
  rl.close();

  fs.writeFileSync(ENV, env);
  console.log(`✔ Wrote ${ENV}${fs.existsSync(`${ENV}.backup`) ? " (previous version in .env.backup)" : ""}`);

  // 4. Database: show market data, and save the alert addresses in Admin → Settings
  process.env.DATABASE_URL = getVar(env, "DATABASE_URL") || process.env.DATABASE_URL;
  const db = new PrismaClient();
  try {
    const source = await db.marketDataSource.findFirst({ orderBy: { createdAt: "asc" } });
    const on = getVar(env, "MARKET_DATA_MODE") !== "none";
    const data = { isActive: on, providerName: getVar(env, "MARKET_DATA_MODE") === "exchange" ? "DSE, CSE" : (source?.providerName ?? null) };
    if (source) await db.marketDataSource.update({ where: { id: source.id }, data });
    else await db.marketDataSource.create({ data: { name: "Market data", ...data } });
    console.log(`✔ Market data ${on ? "switched on" : "switched off"} on the website.`);
    if (alertTo) {
      const list = [...new Set(alertTo.split(/[,\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)))];
      await db.siteSetting.upsert({ where: { key: "leads.alertEmails" }, update: { value: list }, create: { key: "leads.alertEmails", value: list } });
      console.log(`✔ New-lead emails go to: ${list.join(", ")}`);
    }
  } catch (error) {
    console.error("✖ Could not update the database (is PostgreSQL running and DATABASE_URL right?):", (error as Error).message);
    console.error("  The .env changes were saved. Fix the database connection and run `npm run setup -- --yes` again.");
  } finally {
    await db.$disconnect();
  }
  console.log("\nDone. Restart the site (stop npm run dev, then start it again) so it picks up the new settings.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
