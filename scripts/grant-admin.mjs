#!/usr/bin/env node
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const DIRECT_URL = process.env["DIRECT_URL"];
const email = process.argv[2];

if (!DIRECT_URL) {
  console.error("✋ grant-admin: DIRECT_URL is not set. Add it to .env (see .env.example).");
  process.exit(1);
}

if (!email) {
  console.error("✋ grant-admin: usage: npm run db:grant-admin -- <email>");
  process.exit(1);
}

const pool = new Pool({ connectionString: DIRECT_URL });

try {
  const result = await pool.query(
    `UPDATE "User" SET "role" = 'admin' WHERE LOWER("email") = LOWER($1)`,
    [email]
  );

  if (result.rowCount === 0) {
    console.error(`✋ grant-admin: no user found for "${email}".`);
    console.error("   If the account hasn't signed in yet, log in once on the site first");
    console.error("   (the user row is auto-created on first login), then re-run this script.");
    process.exit(1);
  }

  console.log(`✓ granted admin to ${result.rowCount} user(s) matching "${email}".`);
  const check = await pool.query(
    `SELECT "id", "email", "role" FROM "User" WHERE LOWER("email") = LOWER($1)`,
    [email]
  );
  for (const row of check.rows) {
    console.log(`  - ${row.email} (role: ${row.role})`);
  }
} finally {
  await pool.end();
}
