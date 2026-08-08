#!/usr/bin/env node
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];

function isDestructive(args) {
  const [sub, ...rest] = args;
  if (sub === "migrate") {
    const cmd = rest[0];
    if (cmd === "dev" || cmd === "reset") return true;
    if (cmd === "deploy") return false;
  }
  if (sub === "db" && rest[0] === "push") {
    return rest.includes("--accept-data-loss") || rest.includes("--force-reset");
  }
  return false;
}

const ALLOW_ENV = "ALLOW_DESTRUCTIVE_MIGRATIONS";

function parseUrl(url) {
  try {
    const u = new URL(url);
    return { host: u.host, hostname: u.hostname, database: u.pathname.replace(/^\//, "") };
  } catch {
    return null;
  }
}

function isSharedDb(url) {
  if (!url) return false;
  const parsed = parseUrl(url);
  if (!parsed) return false;
  const hostname = parsed.hostname;
  if (LOCAL_HOSTS.includes(hostname)) return false;
  return true;
}

function redact(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = "****";
    return u.toString();
  } catch {
    return "(unparseable url)";
  }
}

const directUrl = process.env["DIRECT_URL"] || process.env["DATABASE_URL"];
const args = process.argv.slice(2);

if (isDestructive(args) && isSharedDb(directUrl)) {
  const allow = process.env[ALLOW_ENV] === "true";
  const command = ["prisma", ...args].join(" ");
  if (!allow) {
    console.error("");
    console.error("✋ db-guard: blocked destructive Prisma command against the shared Supabase database.");
    console.error(`   command : ${command}`);
    console.error(`   target  : ${redact(directUrl)}`);
    console.error("");
    console.error("   `migrate dev` / `migrate reset` / `db push --accept-data-loss` drop data");
    console.error("   (`DROP SCHEMA \"public\" CASCADE`). This already wiped the production DB once.");
    console.error("");
    console.error(`   To override, set ${ALLOW_ENV}=true (you probably shouldn't).`);
    console.error("");
    process.exit(1);
  }
  console.error(`⚠️  db-guard: ${ALLOW_ENV}=true set — allowing destructive command.`);
}

const prismaBin = path.join(projectRoot, "node_modules", ".bin", "prisma");
const result = spawnSync(prismaBin, args, { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
