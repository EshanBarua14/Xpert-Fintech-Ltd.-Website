/**
 * Sets (or resets) an admin's password from the command line, and unlocks the
 * account. Creates the admin if the email does not exist yet.
 *
 *   npm run admin:password -- you@example.com
 *
 * The password is asked for interactively, so it never lands in shell history
 * or in .env. All existing sessions for that admin are signed out.
 */
import { createInterface } from "node:readline";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

// One reader for both questions, so piped or non-TTY input (Git Bash) works too.
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
const lines: string[] = [];
const waiting: ((line: string) => void)[] = [];
rl.on("line", (line) => {
  const next = waiting.shift();
  if (next) next(line);
  else lines.push(line);
});
let hidden = false;
// Hide what is typed after the question (on a real terminal).
(rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
  if (!hidden) process.stdout.write(s);
};

function ask(question: string): Promise<string> {
  hidden = false;
  process.stdout.write(question);
  hidden = true;
  const ready = lines.shift();
  if (ready !== undefined) return Promise.resolve(ready);
  return new Promise((resolve) => waiting.push(resolve));
}

async function main() {
  // npm run admin:password -- --list : who can sign in, and whether an account is locked or switched off.
  if (process.argv.includes("--list")) {
    rl.close();
    const db = new PrismaClient();
    const admins = await db.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: { email: true, isActive: true, lockedUntil: true, totpEnabled: true, lastLoginAt: true } });
    if (!admins.length) console.log("No admin accounts yet. Create one: npm run admin:password -- you@example.com");
    for (const a of admins) {
      const notes = [!a.isActive && "switched off", a.lockedUntil && a.lockedUntil > new Date() && "locked", a.totpEnabled && "two-step on"].filter(Boolean).join(", ");
      console.log(`${a.email}${notes ? `  (${notes})` : ""}  last sign-in: ${a.lastLoginAt?.toISOString() ?? "never"}`);
    }
    await db.$disconnect();
    return;
  }
  const email = (process.argv[2] ?? process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("Usage: npm run admin:password -- you@example.com");
    process.exit(1);
  }

  const password = await ask("New password (12+ characters): ");
  if (password.length < 12) {
    console.error("✖ Password must be at least 12 characters. Nothing changed.");
    process.exit(1);
  }
  const again = await ask("\nType it again: ");
  if (again !== password) {
    console.error("✖ The two passwords do not match. Nothing changed.");
    process.exit(1);
  }
  rl.close();
  process.stdout.write("\n");

  const db = new PrismaClient();
  try {
    const passwordHash = await hash(password);
    const existing = await db.adminUser.findUnique({ where: { email } });
    if (existing) {
      await db.$transaction([
        db.adminUser.update({
          where: { id: existing.id },
          data: { passwordHash, failedLoginCount: 0, lockedUntil: null, isActive: true },
        }),
        db.session.deleteMany({ where: { adminUserId: existing.id } }),
      ]);
      console.log(`✔ Password updated and account unlocked for ${email}.`);
      if (existing.totpEnabled) console.log("  Two-step sign-in is on: you will still need your authenticator code.");
    } else {
      await db.adminUser.create({ data: { email, name: process.env.SEED_ADMIN_NAME || "Xpert Admin", passwordHash } });
      console.log(`✔ Created admin ${email}.`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
