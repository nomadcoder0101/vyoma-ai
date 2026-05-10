import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadDatabaseStatus } from "./database";
import { loadIntegrationStatus } from "./integrations";
import { loadStorageAdapterStatus } from "./storage-adapter";

const dataRoot = join(process.cwd(), "..", "data");

export type ProductionCheck = {
  label: string;
  ready: boolean;
  detail: string;
};

export type StorageFileStatus = {
  file: string;
  exists: boolean;
};

export function loadSettingsStatus() {
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
  const storageAdapter = loadStorageAdapterStatus();
  const database = loadDatabaseStatus();
  const storageFiles = [
    "applications.md",
    "profiles/samruddhi.json",
    "leads.json",
    "assistant-memory.json",
    "tracker-actions.json",
    "daily-actions.json",
  ].map((file) => ({
    file,
    exists: existsSync(join(dataRoot, file)),
  }));

  const productionChecks = [
    {
      label: "OpenAI API key",
      ready: openAiConfigured,
      detail: openAiConfigured ? "Assistant can call OpenAI." : "Assistant is using local fallback.",
    },
    {
      label: "Clerk authentication",
      ready: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY),
      detail: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
        ? "Clerk login is configured and protected routes are active."
        : "Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to activate sign-in.",
    },
    {
      label: "Database",
      ready: database.ready,
      detail: database.detail,
    },
    {
      label: "Resume file upload",
      ready: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      detail: process.env.BLOB_READ_WRITE_TOKEN
        ? "Blob storage is configured for direct resume uploads, protected downloads, and automatic parsing."
        : "Resume metadata, comments, and parsing code are ready. Add blob storage before direct file uploads.",
    },
    {
      label: "LinkedIn OAuth",
      ready: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
      detail: "Use official OAuth only; do not collect LinkedIn passwords.",
    },
  ];

  return {
    appUrl,
    openAiConfigured,
    openAiModel: process.env.OPENAI_MODEL || "gpt-5.4-mini",
    storageMode: storageAdapter.mode === "local" ? "local-json-markdown" : "postgres",
    database,
    storageAdapter,
    integrations: loadIntegrationStatus(),
    dataRoot,
    storageFiles,
    productionChecks,
  };
}
