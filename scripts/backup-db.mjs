#!/usr/bin/env node
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const DIRECT_URL = process.env["DIRECT_URL"];
if (!DIRECT_URL) {
  console.error("✋ backup: DIRECT_URL is not set. Add it to .env (see .env.example).");
  process.exit(1);
}

const BACKUP_DIR = path.resolve("backups");
const RETENTION = Number(process.env["BACKUP_RETENTION"] ?? "14");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = path.join(BACKUP_DIR, `universe-${stamp}.dump`);

mkdirSync(BACKUP_DIR, { recursive: true });

const result = spawnSync(
  "pg_dump",
  ["--dbname", DIRECT_URL, "--format", "custom", "--file", outFile],
  { stdio: "inherit", env: process.env },
);

if (result.status !== 0) {
  console.error("✋ backup: pg_dump failed (exit " + result.status + ").");
  console.error("   Is postgresql-client installed? (e.g. apt install postgresql-client)");
  process.exit(result.status ?? 1);
}

const sizeMb = (statSync(outFile).size / 1024 / 1024).toFixed(2);
console.log(`✓ backup written: ${outFile} (${sizeMb} MB)`);

const dumps = readdirSync(BACKUP_DIR)
  .filter((f) => f.endsWith(".dump"))
  .map((f) => path.join(BACKUP_DIR, f))
  .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);

if (dumps.length > RETENTION) {
  for (const old of dumps.slice(RETENTION)) {
    rmSync(old);
    console.log(`  pruned: ${path.basename(old)}`);
  }
}
console.log(`✓ retention kept: ${Math.min(dumps.length, RETENTION)} of ${dumps.length} backup(s)`);
