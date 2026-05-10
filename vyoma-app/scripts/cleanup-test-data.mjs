import { neon } from "@neondatabase/serverless";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
loadEnvFile(join(root, ".env.local"));

const email = (process.env.CLERK_TEST_EMAIL || "test@vyomaai.in").toLowerCase();
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  console.log("Skipped Postgres test cleanup: no database URL configured.");
  process.exit(0);
}

const sql = neon(databaseUrl);
await sql.query("delete from users where email = $1", [email]);
console.log(`Deleted app test data for ${email}.`);

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
