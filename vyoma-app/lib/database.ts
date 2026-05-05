import { neon } from "@neondatabase/serverless";

export type DatabaseStatus = {
  configured: boolean;
  driverInstalled: boolean;
  repositoriesImplemented: boolean;
  ready: boolean;
  provider: DatabaseProviderPlan;
  detail: string;
};

export type DatabaseHealth = {
  checkedAt: string;
  ok: boolean;
  skipped: boolean;
  detail: string;
};

export type DatabaseProviderPlan = {
  name: string;
  packageName: string;
  installCommand: string;
  envVars: string[];
  reason: string;
  nextSteps: string[];
};

export const selectedDatabaseProvider: DatabaseProviderPlan = {
  name: "Neon Postgres through Vercel Marketplace",
  packageName: "@neondatabase/serverless",
  installCommand: "npm.cmd install @neondatabase/serverless",
  envVars: [
    "DATABASE_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
  ],
  reason:
    "This matches Vercel's current Marketplace Postgres path, uses Neon's actively maintained serverless driver, and avoids committing to Supabase Auth before auth is chosen.",
  nextSteps: [
    "Create a Neon database from the Vercel Marketplace.",
    "Run migrations/0001_initial_schema.sql and migrations/0002_updated_at_triggers.sql.",
    "Set DATABASE_URL or the injected Neon Postgres variables.",
    "Implement Postgres repositories one area at a time behind VYOMA_STORAGE_MODE=postgres.",
  ],
};

export function loadDatabaseStatus(): DatabaseStatus {
  const configured = Boolean(getDatabaseUrl());
  const driverInstalled = true;
  const repositoriesImplemented = false;

  return {
    configured,
    driverInstalled,
    repositoriesImplemented,
    ready: configured && driverInstalled && repositoriesImplemented,
    provider: selectedDatabaseProvider,
    detail: configured
      ? "Neon serverless driver is installed and a Postgres connection variable is set. Repository implementations are still blocked."
      : "Neon serverless driver is installed, but Postgres connection variables are not set. The app is using local file storage.",
  };
}

export function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  );
}

export function getDatabaseSql() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) assertDatabaseReady("Database client");
  return neon(databaseUrl);
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const checkedAt = new Date().toISOString();
  const status = loadDatabaseStatus();

  if (!status.configured) {
    return {
      checkedAt,
      ok: false,
      skipped: true,
      detail: "Skipped database ping because no Postgres connection variable is configured.",
    };
  }

  try {
    const sql = getDatabaseSql();
    await sql`select 1 as ok`;
    return {
      checkedAt,
      ok: true,
      skipped: false,
      detail: "Database connection ping succeeded.",
    };
  } catch (error) {
    return {
      checkedAt,
      ok: false,
      skipped: false,
      detail: error instanceof Error ? error.message : "Database connection ping failed.",
    };
  }
}

export function assertDatabaseReady(area: string): never {
  const status = loadDatabaseStatus();
  const reason = status.configured
    ? "Repository implementation is not wired yet."
    : "Postgres connection variables are missing.";

  throw new Error(
    `${area} requires Postgres storage, but database access is not ready. ${reason} Keep VYOMA_STORAGE_MODE=local until database wiring is complete.`,
  );
}
