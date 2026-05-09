import { neon } from "@neondatabase/serverless";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const migrationsDir = join(root, "migrations");
const migrationFiles = [
  "0001_initial_schema.sql",
  "0002_updated_at_triggers.sql",
  "0003_profile_runtime_shape.sql",
  "0004_daily_task_action_ids.sql",
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
  for (const query of splitSqlStatements(statement)) {
    await sql.query(query, []);
  }
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

function splitSqlStatements(sqlText) {
  const statements = [];
  let current = "";
  let singleQuote = false;
  let doubleQuote = false;
  let lineComment = false;
  let blockComment = false;
  let dollarQuote = "";

  for (let index = 0; index < sqlText.length; index += 1) {
    const char = sqlText[index];
    const next = sqlText[index + 1] || "";

    if (lineComment) {
      current += char;
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        index += 1;
        blockComment = false;
      }
      continue;
    }

    if (dollarQuote) {
      if (sqlText.startsWith(dollarQuote, index)) {
        current += dollarQuote;
        index += dollarQuote.length - 1;
        dollarQuote = "";
      } else {
        current += char;
      }
      continue;
    }

    if (!singleQuote && !doubleQuote && char === "-" && next === "-") {
      current += char + next;
      index += 1;
      lineComment = true;
      continue;
    }

    if (!singleQuote && !doubleQuote && char === "/" && next === "*") {
      current += char + next;
      index += 1;
      blockComment = true;
      continue;
    }

    if (!singleQuote && !doubleQuote && char === "$") {
      const match = sqlText.slice(index).match(/^\$[A-Za-z0-9_]*\$/);
      if (match) {
        dollarQuote = match[0];
        current += dollarQuote;
        index += dollarQuote.length - 1;
        continue;
      }
    }

    if (!doubleQuote && char === "'" && sqlText[index - 1] !== "\\") {
      singleQuote = !singleQuote;
      current += char;
      continue;
    }

    if (!singleQuote && char === '"') {
      doubleQuote = !doubleQuote;
      current += char;
      continue;
    }

    if (!singleQuote && !doubleQuote && char === ";") {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}
