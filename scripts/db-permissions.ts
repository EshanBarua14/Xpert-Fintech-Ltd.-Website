/**
 * Fixes "permission denied for table …": gives the website's database user
 * (the one in DATABASE_URL) ownership of every table, sequence and enum type in
 * the database, so the site can read and write them and future migrations run.
 *
 *   npm run db:permissions
 *
 * It asks for an administrator login for the same PostgreSQL server (usually
 * the "postgres" user and the password chosen when PostgreSQL was installed).
 * Nothing is deleted and no data changes; only who owns the tables.
 */
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { PrismaClient } from "@prisma/client";

const envFile = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envFile) && !process.env.DATABASE_URL) {
  const m = /^DATABASE_URL=(.*)$/m.exec(fs.readFileSync(envFile, "utf8"));
  if (m) process.env.DATABASE_URL = m[1]!.trim().replace(/^"(.*)"$/, "$1");
}

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
let hidden = false;
(rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
  if (!hidden) process.stdout.write(s);
};
const ask = (q: string, secret = false) =>
  new Promise<string>((resolve) => {
    hidden = false;
    process.stdout.write(q);
    hidden = secret;
    rl.once("line", (l) => {
      hidden = false;
      if (secret) process.stdout.write("\n");
      resolve(l.trim());
    });
  });

const ident = (s: string) => `"${s.replace(/"/g, '""')}"`;

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set in .env");
  const appUrl = new URL(raw);
  const appUser = decodeURIComponent(appUrl.username);
  const schema = appUrl.searchParams.get("schema") || "public";
  console.log(`\nWebsite database: ${appUrl.pathname.slice(1)} on ${appUrl.hostname}:${appUrl.port || 5432}, user "${appUser}", schema "${schema}".`);

  const adminUser = (await ask('PostgreSQL administrator user [postgres]: ')) || "postgres";
  const adminPass = await ask(`Password for "${adminUser}" (typing is hidden): `, true);
  rl.close();

  const adminUrl = new URL(raw);
  adminUrl.username = encodeURIComponent(adminUser);
  adminUrl.password = encodeURIComponent(adminPass);
  const db = new PrismaClient({ datasourceUrl: adminUrl.toString() });
  try {
    const tables = await db.$queryRawUnsafe<{ name: string }[]>(`SELECT tablename AS name FROM pg_tables WHERE schemaname = $1`, schema);
    const sequences = await db.$queryRawUnsafe<{ name: string }[]>(`SELECT sequence_name AS name FROM information_schema.sequences WHERE sequence_schema = $1`, schema);
    const types = await db.$queryRawUnsafe<{ name: string }[]>(
      `SELECT t.typname AS name FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = $1 AND t.typtype = 'e'`,
      schema,
    );
    const s = ident(schema);
    const u = ident(appUser);
    await db.$executeRawUnsafe(`GRANT ALL ON SCHEMA ${s} TO ${u}`);
    for (const t of tables) await db.$executeRawUnsafe(`ALTER TABLE ${s}.${ident(t.name)} OWNER TO ${u}`);
    for (const q of sequences) await db.$executeRawUnsafe(`ALTER SEQUENCE ${s}.${ident(q.name)} OWNER TO ${u}`);
    for (const t of types) await db.$executeRawUnsafe(`ALTER TYPE ${s}.${ident(t.name)} OWNER TO ${u}`);
    await db.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${s} GRANT ALL ON TABLES TO ${u}`);
    await db.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${s} GRANT ALL ON SEQUENCES TO ${u}`);
    console.log(`✔ "${appUser}" now owns ${tables.length} tables, ${sequences.length} sequences and ${types.length} types. Restart the site (npm run dev).\n`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  const msg = (e as Error).message ?? String(e);
  console.error(/authentication failed|password/i.test(msg) ? "✖ That administrator user or password was not accepted." : `✖ ${msg}`);
  process.exit(1);
});
