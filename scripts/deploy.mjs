#!/usr/bin/env node
// One command to put the site live on Namecheap (frontend, admin and API together):
//   npm run deploy               build on GitHub and put live at https://xpertfintech.com
//   npm run deploy -- rollback   go back to the previous release
// It starts .github/workflows/deploy-namecheap.yml and follows it to the end.
// Needs the GitHub CLI (https://cli.github.com, then `gh auth login`). Setup: docs/DEPLOY-NAMECHEAP.md
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";

const action = process.argv[2] === "rollback" ? "rollback" : "deploy";
const shell = process.platform === "win32";
const gh = (args, opts = {}) => spawnSync("gh", args, { shell, encoding: "utf8", ...opts });

if (gh(["--version"]).status !== 0) {
  console.error("The GitHub CLI (gh) is needed: install it from https://cli.github.com and run `gh auth login`.");
  process.exit(1);
}
const enabled = gh(["variable", "get", "DEPLOY_ENABLED"]).stdout?.trim();
if (enabled !== "yes") {
  console.error("Deploying is switched off (GitHub variable DEPLOY_ENABLED is not \"yes\"). See docs/DEPLOY-NAMECHEAP.md, \"Go live\".");
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const typed = (await rl.question(`${action === "rollback" ? "Roll back" : "Deploy"} https://xpertfintech.com? Type xpertfintech.com to confirm: `)).trim();
rl.close();
if (typed !== "xpertfintech.com") {
  console.log("Not confirmed; nothing was done.");
  process.exit(1);
}

const before = gh(["run", "list", "--workflow", "deploy-namecheap.yml", "--limit", "1", "--json", "databaseId", "-q", ".[0].databaseId"]).stdout?.trim();
const start = gh(["workflow", "run", "deploy-namecheap.yml", "--ref", "main", "-f", "confirm=xpertfintech.com", "-f", `action=${action}`], { stdio: "inherit" });
if (start.status !== 0) process.exit(start.status ?? 1);

// Wait for GitHub to list the new run, then follow it.
let id = "";
for (let i = 0; i < 30 && (!id || id === before); i++) {
  await new Promise((r) => setTimeout(r, 3000));
  id = gh(["run", "list", "--workflow", "deploy-namecheap.yml", "--limit", "1", "--json", "databaseId", "-q", ".[0].databaseId"]).stdout?.trim() ?? "";
}
if (!id || id === before) {
  console.log("Started. Follow it in GitHub → Actions → deploy-namecheap.");
  process.exit(0);
}
const watch = gh(["run", "watch", id, "--exit-status"], { stdio: "inherit" });
console.log(watch.status === 0 ? "\nLive: https://xpertfintech.com" : `\nThe deploy failed; details: gh run view ${id} --log-failed`);
process.exit(watch.status ?? 1);
