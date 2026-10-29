#!/usr/bin/env node
/**
 * Static security check (CI): every server action ("use server") and every
 * admin API route must check who is signed in before doing anything.
 *
 *  - Admin actions must call requireAdmin / requireFullAdmin / getCurrentAdmin
 *    themselves, or call a function in src/lib that does.
 *  - Actions that create, delete, trash, restore, purge, or manage users and
 *    backups must be admins-only (requireFullAdmin or assertMayCreate),
 *    directly or one call down.
 *  - Public actions (the website's forms and the sign-in itself) are listed below.
 *
 * Prints one line per problem and exits 1 when there is any.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC_ACTIONS = new Set(["submitLead", "applyForJob", "loginAction", "verifyLoginCode", "logoutAction"]);
const GUARD = /\b(requireAdmin|requireFullAdmin|getCurrentAdmin|assertMayCreate)\s*\(/;
const FULL = /\b(requireFullAdmin|assertMayCreate)\s*\(/;
const ADMIN_ONLY_NAME = /^(delete|trash|restore(?!Version)|purge|remove|create|add|backup|import|invite|setRole|resetPassword|empty)/i;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== "node_modules" && !name.startsWith(".")) walk(p, out);
    } else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

/** Exported async functions of a file, with their bodies. */
function functions(src) {
  const out = [];
  const re = /export\s+async\s+function\s+(\w+)\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    let i = src.indexOf("{", re.lastIndex);
    // Skip a typed parameter object ({ ... }: Type) before the body.
    const close = src.indexOf(")", re.lastIndex);
    if (close > -1) {
      let depth = 0;
      for (let j = re.lastIndex - 1; j < src.length; j++) {
        if (src[j] === "(") depth++;
        else if (src[j] === ")" && --depth === 0) {
          // Past a return type such as Promise<{ a: string }>: the body is the first { outside < >.
          let angle = 0;
          for (let k = j + 1; k < src.length; k++) {
            if (src[k] === "<") angle++;
            else if (src[k] === ">" && src[k - 1] !== "=") angle--;
            else if (src[k] === "{" && angle === 0) {
              i = k;
              break;
            }
          }
          break;
        }
      }
    }
    let depth = 0;
    let j = i;
    for (; j < src.length; j++) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}" && --depth === 0) break;
    }
    out.push({ name: m[1], body: src.slice(i, j + 1) });
  }
  return out;
}

const files = walk(path.join(ROOT, "src"));
// Every exported async function in the codebase, by name: used to look one call down.
const byName = new Map();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const fn of functions(src)) if (!byName.has(fn.name)) byName.set(fn.name, fn.body);
}
const calls = (body) => [...body.matchAll(/\b([a-zA-Z_]\w*)\s*\(/g)].map((m) => m[1]);
const guardedDeep = (body, re) => re.test(body) || calls(body).some((c) => byName.has(c) && re.test(byName.get(c)));

const problems = [];
let checked = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const rel = path.relative(ROOT, f);
  if (/^\s*["']use server["']/.test(src)) {
    for (const fn of functions(src)) {
      if (PUBLIC_ACTIONS.has(fn.name)) continue;
      checked++;
      if (!guardedDeep(fn.body, GUARD)) problems.push(`${rel}: ${fn.name} does not check the signed-in admin`);
      else if (rel.includes(`${path.sep}admin${path.sep}`) && ADMIN_ONLY_NAME.test(fn.name) && !guardedDeep(fn.body, FULL) && !/selfOnly|own password|ownAccount/i.test(fn.body))
        problems.push(`${rel}: ${fn.name} looks admins-only (create/delete/restore…) but editors are not turned away`);
    }
  }
  // Admin API routes and admin route handlers.
  if (/route\.ts$/.test(rel) && (rel.includes(`api${path.sep}admin`) || rel.startsWith(`src${path.sep}app${path.sep}admin`))) {
    for (const fn of functions(src)) {
      if (!/^(GET|POST|PUT|PATCH|DELETE)$/.test(fn.name)) continue;
      checked++;
      if (!guardedDeep(fn.body, GUARD)) problems.push(`${rel}: ${fn.name} handler does not check the signed-in admin`);
    }
  }
}

for (const p of problems) console.log(`GUARD ${p}`);
console.log(`checked ${checked} server actions and admin routes: ${problems.length} problem(s)`);
process.exit(problems.length ? 1 : 0);
