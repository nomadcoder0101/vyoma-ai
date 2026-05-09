import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { assertDatabaseReady, getDatabaseSql } from "./database";
import { ensureCurrentUserDatabaseId } from "./profile";
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

export type IntegrationAccountInput = Omit<IntegrationAccount, "id" | "connectedAt"> & {
  accessToken?: string;
  refreshToken?: string;
};

export type IntegrationRepository = {
  mode: StorageMode;
  listAccounts: () => IntegrationAccount[];
  connectAccount: (account: IntegrationAccountInput) => IntegrationAccount;
  disconnectAccount: (id: string) => boolean;
};

export type AsyncIntegrationRepository = {
  mode: StorageMode;
  listAccounts: () => Promise<IntegrationAccount[]>;
  connectAccount: (account: IntegrationAccountInput) => Promise<IntegrationAccount>;
  disconnectAccount: (id: string) => Promise<boolean>;
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
  if (mode === "postgres") return blockedSyncPostgresIntegrationRepository;
  return localIntegrationRepository;
}

export function getAsyncIntegrationRepository(): AsyncIntegrationRepository {
  const mode = getStorageMode();
  if (mode === "postgres") return postgresIntegrationRepository;
  return asyncLocalIntegrationRepository;
}

export function loadIntegrationStatus(): IntegrationStatus[] {
  return [
    {
      provider: "linkedin",
      label: "LinkedIn OAuth",
      configured: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
      connected: false,
      repositoryReady: getStorageMode() === "postgres",
      detail:
        "Encrypted Postgres token storage is ready. Official LinkedIn OAuth still needs app credentials and approved scopes.",
    },
  ];
}

export async function loadIntegrationStatusAsync(): Promise<IntegrationStatus[]> {
  const repositoryReady = getStorageMode() === "postgres";
  const accounts = repositoryReady ? await getAsyncIntegrationRepository().listAccounts() : [];

  return [
    {
      provider: "linkedin",
      label: "LinkedIn OAuth",
      configured: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
      connected: accounts.some((account) => account.provider === "linkedin"),
      repositoryReady,
      detail:
        "Encrypted Postgres token storage is ready. Official LinkedIn OAuth still needs app credentials and approved scopes.",
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

const asyncLocalIntegrationRepository: AsyncIntegrationRepository = {
  mode: "local",
  async listAccounts() {
    return [];
  },
  async connectAccount() {
    throw new Error("Local integration storage is disabled. Use official OAuth with encrypted Postgres storage.");
  },
  async disconnectAccount() {
    throw new Error("Local integration storage is disabled. Use official OAuth with encrypted Postgres storage.");
  },
};

const blockedSyncPostgresIntegrationRepository: IntegrationRepository = {
  mode: "postgres",
  listAccounts() {
    assertDatabaseReady("Integration repository sync access");
  },
  connectAccount() {
    assertDatabaseReady("Integration repository sync access");
  },
  disconnectAccount() {
    assertDatabaseReady("Integration repository sync access");
  },
};

const postgresIntegrationRepository: AsyncIntegrationRepository = {
  mode: "postgres",
  async listAccounts() {
    const userId = await ensureCurrentUserDatabaseId();
    const sql = getDatabaseSql();
    const rows = (await sql.query(
      "select id::text, provider, provider_account_id, scopes, expires_at::text, created_at::text from integration_accounts where user_id = $1 order by created_at desc",
      [userId],
    )) as IntegrationAccountRow[];
    return rows.map(rowToIntegrationAccount);
  },
  async connectAccount(account) {
    const userId = await ensureCurrentUserDatabaseId();
    const sql = getDatabaseSql();
    const rows = (await sql.query(
      [
        "insert into integration_accounts (user_id, provider, provider_account_id, scopes, access_token_encrypted, refresh_token_encrypted, expires_at)",
        "values ($1, $2, $3, $4::jsonb, $5, $6, $7)",
        "on conflict (provider, provider_account_id) do update set",
        "user_id = excluded.user_id, scopes = excluded.scopes, access_token_encrypted = excluded.access_token_encrypted, refresh_token_encrypted = excluded.refresh_token_encrypted, expires_at = excluded.expires_at, updated_at = now()",
        "returning id::text, provider, provider_account_id, scopes, expires_at::text, created_at::text",
      ].join(" "),
      [
        userId,
        account.provider,
        account.providerAccountId,
        JSON.stringify(account.scopes),
        account.accessToken ? encryptToken(account.accessToken) : null,
        account.refreshToken ? encryptToken(account.refreshToken) : null,
        account.expiresAt || null,
      ],
    )) as IntegrationAccountRow[];
    return rowToIntegrationAccount(rows[0]);
  },
  async disconnectAccount(id) {
    const userId = await ensureCurrentUserDatabaseId();
    const sql = getDatabaseSql();
    const rows = (await sql.query(
      "delete from integration_accounts where user_id = $1 and id = $2 returning id",
      [userId, id],
    )) as Array<{ id: string }>;
    return Boolean(rows[0]);
  },
};

type IntegrationAccountRow = {
  id: string;
  provider: IntegrationProvider;
  provider_account_id: string;
  scopes: string[] | string;
  expires_at: string | null;
  created_at: string;
};

function rowToIntegrationAccount(row: IntegrationAccountRow): IntegrationAccount {
  return {
    id: row.id,
    provider: row.provider,
    providerAccountId: row.provider_account_id,
    scopes: Array.isArray(row.scopes) ? row.scopes : JSON.parse(row.scopes || "[]"),
    expiresAt: row.expires_at || undefined,
    connectedAt: row.created_at,
  };
}

function encryptToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", integrationKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptTokenForRuntime(value: string) {
  const [ivText, tagText, encryptedText] = value.split(".");
  if (!ivText || !tagText || !encryptedText) throw new Error("Invalid encrypted token payload.");
  const decipher = createDecipheriv("aes-256-gcm", integrationKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function integrationKey() {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY or AUTH_SECRET is required for encrypted OAuth token storage.");
  }
  return createHash("sha256").update(secret).digest();
}
