import { loadDatabaseStatus } from "./database";

export type StorageMode = "local" | "postgres";

export type StorageCapability = {
  area: string;
  local: boolean;
  postgres: boolean;
  repository: boolean;
  localSource: string;
  postgresTarget: string;
  detail: string;
};

export type StorageAdapterStatus = {
  mode: StorageMode;
  activeLabel: string;
  ready: boolean;
  detail: string;
  parity: ReturnType<typeof storageParitySummary>;
  capabilities: StorageCapability[];
};

export const storageCapabilities: StorageCapability[] = [
  {
    area: "Profile",
    local: true,
    postgres: true,
    repository: true,
    localSource: "profiles/samruddhi.json",
    postgresTarget: "profiles, resume_variants, memories",
    detail: "Profile has local and Postgres repository implementations. Runtime still follows VYOMA_STORAGE_MODE.",
  },
  {
    area: "Tracker",
    local: true,
    postgres: true,
    repository: true,
    localSource: "applications.md, tracker-actions.json",
    postgresTarget: "applications, application_events",
    detail: "Tracker has local and Postgres repository implementations. Runtime follows VYOMA_STORAGE_MODE.",
  },
  {
    area: "Leads",
    local: true,
    postgres: true,
    repository: true,
    localSource: "leads.json, applications.md",
    postgresTarget: "leads, applications",
    detail: "Leads have local and Postgres repository implementations. Runtime follows VYOMA_STORAGE_MODE.",
  },
  {
    area: "Assistant memory",
    local: true,
    postgres: true,
    repository: true,
    localSource: "assistant-memory.json",
    postgresTarget: "assistant_messages, memories",
    detail: "Assistant memory has local and Postgres repository implementations. Runtime follows VYOMA_STORAGE_MODE.",
  },
  {
    area: "Daily tasks",
    local: true,
    postgres: true,
    repository: true,
    localSource: "daily-actions.json",
    postgresTarget: "daily_tasks",
    detail: "Daily tasks have local and Postgres repository implementations. Runtime follows VYOMA_STORAGE_MODE.",
  },
  {
    area: "Integrations",
    local: false,
    postgres: false,
    repository: true,
    localSource: "none",
    postgresTarget: "integration_accounts",
    detail: "Integrations now use a repository boundary. Local token storage is disabled; encrypted Postgres storage comes later.",
  },
];

export function storageParitySummary() {
  const converted = storageCapabilities.filter((capability) => capability.repository).length;
  const localActive = storageCapabilities.filter((capability) => capability.local).length;
  const postgresActive = storageCapabilities.filter((capability) => capability.postgres).length;

  return {
    total: storageCapabilities.length,
    converted,
    localActive,
    postgresActive,
    pending: storageCapabilities.length - converted,
  };
}

export function getStorageMode(): StorageMode {
  return process.env.VYOMA_STORAGE_MODE === "postgres" ? "postgres" : "local";
}

export function loadStorageAdapterStatus(): StorageAdapterStatus {
  const mode = getStorageMode();
  const database = loadDatabaseStatus();
  const postgresReady = mode === "postgres" && database.ready;
  const parity = storageParitySummary();

  if (mode === "postgres") {
    return {
      mode,
      activeLabel: "Postgres requested",
      ready: postgresReady,
      detail: postgresReady
        ? "Postgres database access is ready for profile, tracker, leads, daily tasks, and assistant memory."
        : `Postgres mode was requested, but database access is blocked. ${database.detail}`,
      parity,
      capabilities: storageCapabilities,
    };
  }

  return {
    mode,
    activeLabel: "Local file storage",
    ready: true,
    detail: "The app is using JSON and Markdown files in the parent data directory.",
    parity,
    capabilities: storageCapabilities,
  };
}

export function assertWritableStorage() {
  const status = loadStorageAdapterStatus();
  if (status.mode === "postgres") {
    throw new Error(
      "This synchronous storage path is not available in Postgres mode. Use the async repository for converted areas, or keep VYOMA_STORAGE_MODE=local until the remaining repositories are connected.",
    );
  }
  return status;
}
