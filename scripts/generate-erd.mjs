#!/usr/bin/env node
/**
 * Generates docs/ERD.md (a Mermaid erDiagram) from prisma/schema.prisma, and
 * runs basic structural checks. No dependencies, so it works before
 * `npm install`.
 *
 *   node scripts/generate-erd.mjs          # write docs/ERD.md
 *   node scripts/generate-erd.mjs --check  # checks only, non-zero exit on error
 *
 * The checks are a safety net, not a replacement for `npx prisma validate`.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
const checkOnly = process.argv.includes("--check");

const SCALARS = new Set(["String", "Int", "BigInt", "Float", "Decimal", "Boolean", "DateTime", "Json", "Bytes"]);

// ── Parse ────────────────────────────────────────────────────────────────────
const blocks = [...schema.matchAll(/^(model|enum)\s+(\w+)\s*\{([\s\S]*?)^\}/gm)];
const models = new Map();
const enums = new Map();

for (const [, kind, name, body] of blocks) {
  const lines = body
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, "").trim())
    .filter(Boolean);
  if (kind === "enum") {
    enums.set(name, lines);
    continue;
  }
  const fields = [];
  const attrs = [];
  for (const line of lines) {
    if (line.startsWith("@@")) {
      attrs.push(line);
      continue;
    }
    const m = line.match(/^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$/);
    if (!m) throw new Error(`Cannot parse line in ${name}: ${line}`);
    const [, fname, type, list, opt, rest] = m;
    const rel = rest.match(/@relation\(([^)]*)\)/);
    fields.push({
      name: fname,
      type,
      list: !!list,
      optional: !!opt,
      rest,
      relationName: rel?.[1].match(/^"([^"]+)"/)?.[1] ?? rel?.[1].match(/name:\s*"([^"]+)"/)?.[1] ?? null,
      fkFields: rel?.[1].match(/fields:\s*\[([^\]]*)\]/)?.[1].split(",").map((s) => s.trim()) ?? null,
      isId: /@id\b/.test(rest),
      isUnique: /@unique\b/.test(rest),
    });
  }
  models.set(name, { fields, attrs });
}

// ── Checks ───────────────────────────────────────────────────────────────────
const errors = [];
const seenNames = new Set();
for (const [name] of [...models, ...enums]) {
  if (seenNames.has(name)) errors.push(`Duplicate name: ${name}`);
  seenNames.add(name);
}

for (const [mName, model] of models) {
  const fieldNames = new Set();
  const hasId = model.fields.some((f) => f.isId) || model.attrs.some((a) => a.startsWith("@@id"));
  if (!hasId) errors.push(`${mName}: no @id or @@id`);

  for (const f of model.fields) {
    if (fieldNames.has(f.name)) errors.push(`${mName}.${f.name}: duplicate field`);
    fieldNames.add(f.name);

    const known = SCALARS.has(f.type) || enums.has(f.type) || models.has(f.type);
    if (!known) errors.push(`${mName}.${f.name}: unknown type ${f.type}`);

    const def = f.rest.match(/@default\(([^)]*\)?)\)/)?.[1];
    if (def && enums.has(f.type) && !enums.get(f.type).includes(def)) {
      errors.push(`${mName}.${f.name}: default ${def} is not a value of enum ${f.type}`);
    }

    if (f.fkFields) {
      for (const fk of f.fkFields) {
        if (!model.fields.some((x) => x.name === fk)) errors.push(`${mName}.${f.name}: FK field ${fk} missing`);
      }
    }

    if (models.has(f.type)) {
      // Every relation field needs a counterpart on the other model.
      const other = models.get(f.type);
      const back = other.fields.filter(
        (x) => x.type === mName && x.relationName === f.relationName && !(f.type === mName && x.name === f.name),
      );
      if (back.length !== 1) {
        errors.push(`${mName}.${f.name} → ${f.type}: expected 1 back-relation, found ${back.length}`);
      } else if (!f.fkFields && !back[0].fkFields) {
        errors.push(`${mName}.${f.name} → ${f.type}: neither side declares fields/references`);
      }
    }
  }

  for (const a of model.attrs) {
    const cols = a.match(/\[([^\]]*)\]/)?.[1].split(",").map((s) => s.trim()) ?? [];
    for (const c of cols) if (!fieldNames.has(c)) errors.push(`${mName} ${a}: unknown column ${c}`);
  }
}

if (errors.length) {
  console.error(`Schema check failed (${errors.length}):\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log(`Schema check passed: ${models.size} models, ${enums.size} enums.`);
if (checkOnly) process.exit(0);

// ── Mermaid ERD ──────────────────────────────────────────────────────────────
const out = ["erDiagram"];
const drawn = new Set();
for (const [mName, model] of models) {
  for (const f of model.fields) {
    if (!models.has(f.type) || !f.fkFields) continue;
    const other = models.get(f.type);
    const back = other.fields.find((x) => x.type === mName && x.relationName === f.relationName && x !== f);
    const key = `${mName}.${f.name}`;
    if (drawn.has(key)) continue;
    drawn.add(key);
    const fkUnique = f.fkFields.every((c) => model.fields.find((x) => x.name === c)?.isUnique);
    const many = back?.list && !fkUnique;
    const left = f.optional ? "|o" : "||";
    const right = many ? "o{" : "o|";
    out.push(`  ${f.type} ${left}--${right} ${mName} : "${f.name}"`);
  }
}
for (const [mName, model] of models) {
  out.push(`  ${mName} {`);
  for (const f of model.fields) {
    if (models.has(f.type)) continue;
    const key = f.isId ? " PK" : f.isUnique ? " UK" : model.fields.some((x) => x.fkFields?.includes(f.name)) ? " FK" : "";
    out.push(`    ${f.type}${f.list ? "_list" : ""} ${f.name}${key}`);
  }
  out.push("  }");
}

const doc = `# XPERT NEXUS — Entity relationship diagram

Generated from \`prisma/schema.prisma\` by \`npm run db:erd\`. Do not edit by hand.

${models.size} tables, ${enums.size} enums. \`*Translation\` tables hold one row per locale (en, bn).
Polymorphic links (ContentRelation, SeoMetadata, MediaUsage) use \`entityType\` + \`entityId\` and are not drawn as lines.

\`\`\`mermaid
${out.join("\n")}
\`\`\`
`;
mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(join(root, "docs/ERD.md"), doc);
console.log("Wrote docs/ERD.md");
