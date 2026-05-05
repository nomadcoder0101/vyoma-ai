import { neon } from "@neondatabase/serverless";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const migrationsDir = join(root, "migrations");
const migrationFiles = [
  "0001_initial_schema.sql",
  "0002_updated_at_triggers.sql",
];

loadEnvFile(join(root, ".env.local"));

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL.");
  console.error("Create a Neon database, add credentials to .env.local, then rerun npm.cmd run db:migrate.");
  process.exit(1);
}

const sql = neon(databaseUrl);

for (const file of migrationFiles) {
  const filePath = join(migrationsDir, file);
  const statement = readFileSync(filePath, "utf8").trim();

  if (!statement) {
    console.log(`Skipping empty migration ${file}`);
    continue;
  }

  console.log(`Running ${file}`);
  await sql.query(statement, []);
  console.log(`Finished ${file}`);
}

console.log("Database migrations completed.");

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
