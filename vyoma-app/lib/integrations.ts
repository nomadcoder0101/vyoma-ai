import { assertDatabaseReady } from "./database";
import { getStorageMode, type StorageMode } from "./storage-adapter";

export type IntegrationProvider = "linkedin";

export type IntegrationAccount = {
  id: string;
  provider: IntegrationProvider;
  providerAccountId: string;
  scopes: string[];
  expiresAt?: string;
  connectedAt: string;
};

export type IntegrationRepository = {
  mode: StorageMode;
  listAccounts: () => IntegrationAccount[];
  connectAccount: (account: IntegrationAccount) => IntegrationAccount;
  disconnectAccount: (id: string) => boolean;
};

export type IntegrationStatus = {
  provider: IntegrationProvider;
  label: string;
  configured: boolean;
  connected: boolean;
  repositoryReady: boolean;
  detail: string;
};

export function getIntegrationRepository(): IntegrationRepository {
  const mode = getStorageMode();
  if (mode === "postgres") return postgresIntegrationRepository;
  return localIntegrationRepository;
}

export function loadIntegrationStatus(): IntegrationStatus[] {
  const accounts = getIntegrationRepository().listAccounts();

  return [
    {
      provider: "linkedin",
      label: "LinkedIn OAuth",
      configured: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
      connected: accounts.some((account) => account.provider === "linkedin"),
      repositoryReady: true,
      detail:
        "Official OAuth metadata has a repository boundary. Token storage is blocked until encrypted Postgres storage is implemented.",
    },
  ];
}

const localIntegrationRepository: IntegrationRepository = {
  mode: "local",
  listAccounts() {
    return [];
  },
  connectAccount() {
    throw new Error("Local integration storage is disabled. Use official OAuth with encrypted Postgres storage.");
  },
  disconnectAccount() {
    throw new Error("Local integration storage is disabled. Use official OAuth with encrypted Postgres storage.");
  },
};

const postgresIntegrationRepository: IntegrationRepository = {
  mode: "postgres",
  listAccounts() {
    assertDatabaseReady("Integration repository");
  },
  connectAccount() {
    assertDatabaseReady("Integration repository");
  },
  disconnectAccount() {
    assertDatabaseReady("Integration repository");
  },
};
