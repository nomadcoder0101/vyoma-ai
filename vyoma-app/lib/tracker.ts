import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { assertDatabaseReady, getDatabaseSql } from "./database";
import { ensureActiveProfileDatabaseId } from "./profile";
import { assertWritableStorage, getStorageMode, type StorageMode } from "./storage-adapter";

export type Application = {
  num: number;
  date: string;
  company: string;
  role: string;
  score: string;
  status: string;
  notes: string;
  bucket: string;
  daysSinceApplication: number | null;
  urgency: "waiting" | "due" | "overdue";
  pipelineStatus?: PipelineStatus;
  actionNotes?: string;
  lastActionAt?: string;
};

export type PipelineStatus =
  | "applied"
  | "follow_up_sent"
  | "interview"
  | "rejected"
  | "offer"
  | "closed";

export type TrackerOverlay = Record<
  string,
  {
    pipelineStatus: PipelineStatus;
    actionNotes: string;
    lastActionAt: string;
  }
>;

const TRACKER_PATH = join(process.cwd(), "..", "data", "applications.md");
const TRACKER_OVERLAY_PATH = join(process.cwd(), "..", "data", "tracker-actions.json");
const TODAY = new Date("2026-05-02T00:00:00+08:00");

export type TrackerRepository = {
  mode: StorageMode;
  loadApplications: () => Application[];
  loadOverlay: () => TrackerOverlay;
  saveOverlay: (overlay: TrackerOverlay) => TrackerOverlay;
};

export type AsyncTrackerRepository = {
  mode: StorageMode;
  loadApplications: () => Promise<Application[]>;
  updateApplicationAction: (input: {
    num: number;
    pipelineStatus: PipelineStatus;
    note?: string;
  }) => Promise<Application | null>;
};

export function loadApplications(): Application[] {
  return getTrackerRepository().loadApplications();
}

export async function loadApplicationsAsync(): Promise<Application[]> {
  return getAsyncTrackerRepository().loadApplications();
}

export function loadTrackerOverlay(): TrackerOverlay {
  return getTrackerRepository().loadOverlay();
}

export function updateApplicationAction(input: {
  num: number;
  pipelineStatus: PipelineStatus;
  note?: string;
}) {
  const repository = getTrackerRepository();
  const apps = repository.loadApplications();
  const app = apps.find((item) => item.num === input.num);
  if (!app) return null;

  const overlay = repository.loadOverlay();
  const existing = overlay[String(input.num)];
  const note = sanitizeNote(input.note || "");
  overlay[String(input.num)] = {
    pipelineStatus: input.pipelineStatus,
    actionNotes: [existing?.actionNotes, note].filter(Boolean).join(" | "),
    lastActionAt: new Date().toISOString(),
  };
  repository.saveOverlay(overlay);

  return mergeOverlay(app, overlay);
}

export async function updateApplicationActionAsync(input: {
  num: number;
  pipelineStatus: PipelineStatus;
  note?: string;
}) {
  return getAsyncTrackerRepository().updateApplicationAction(input);
}

export function getTrackerRepository(): TrackerRepository {
  const mode = getStorageMode();
  if (mode === "postgres") return blockedSyncPostgresTrackerRepository;
  return localTrackerRepository;
}

export function getAsyncTrackerRepository(): AsyncTrackerRepository {
  const mode = getStorageMode();
  if (mode === "postgres") return postgresTrackerRepository;
  return asyncLocalTrackerRepository;
}

export function trackerSummary(apps: Application[]) {
  const overdue = apps.filter((app) => app.urgency === "overdue").length;
  const waiting = apps.filter((app) => app.urgency === "waiting").length;
  const due = apps.filter((app) => app.urgency === "due").length;
  const buckets = countBy(apps, (app) => app.bucket);
  const companies = countBy(apps, (app) => normalizeCompany(app.company));
  const repeatedCompanies = [...companies.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return {
    total: apps.length,
    overdue,
    waiting,
    due,
    buckets,
    repeatedCompanies,
    latest: [...apps].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    followUps: [...apps]
      .filter((app) => app.urgency !== "waiting")
      .sort((a, b) => {
        const daysA = a.daysSinceApplication ?? 0;
        const daysB = b.daysSinceApplication ?? 0;
        return daysB - daysA;
      })
      .slice(0, 8),
  };
}

function parseLine(line: string): Application | null {
  const parts = line.split("|").map((part) => part.trim());
  if (parts.length < 9) return null;

  const num = Number(parts[1]);
  if (!Number.isFinite(num)) return null;

  const date = parts[2];
  const daysSinceApplication = daysSince(date);
  const urgency = classifyUrgency(daysSinceApplication);
  const role = parts[4];

  return {
    num,
    date,
    company: parts[3],
    role,
    score: parts[5],
    status: parts[6],
    notes: parts[9] ?? "",
    bucket: classifyRole(role),
    daysSinceApplication,
    urgency,
  };
}

function mergeOverlay(app: Application | null, overlay: TrackerOverlay) {
  if (!app) return null;
  const action = overlay[String(app.num)];
  if (!action) return app;
  return {
    ...app,
    pipelineStatus: action.pipelineStatus,
    actionNotes: action.actionNotes,
    lastActionAt: action.lastActionAt,
  };
}

function classifyRole(role: string) {
  const value = role.toLowerCase();
  if (
    value.includes("transaction monitoring") ||
    value.includes("surveillance") ||
    value.includes("tm ") ||
    value.includes("tm&") ||
    value.includes("monitoring")
  ) {
    return "Transaction Monitoring / Surveillance";
  }
  if (
    value.includes("kyc") ||
    value.includes("kyb") ||
    value.includes("cdd") ||
    value.includes("due diligence") ||
    value.includes("onboarding") ||
    value.includes("client verification") ||
    value.includes("periodic review")
  ) {
    return "KYC / CDD / EDD / Onboarding";
  }
  if (
    value.includes("financial crime") ||
    value.includes("fincrime") ||
    value.includes("aml") ||
    value.includes("anti-money") ||
    value.includes("fcc") ||
    value.includes("cft")
  ) {
    return "AML / Financial Crime Compliance";
  }
  if (value.includes("fraud") || value.includes("risk")) {
    return "Fraud / Risk adjacent";
  }
  if (value.includes("customer success") || value.includes("client management")) {
    return "Non-core / broad operations";
  }
  if (value.includes("unknown role")) {
    return "Unknown / sanitized";
  }
  return "Other compliance / unclear";
}

function classifyUrgency(days: number | null): Application["urgency"] {
  if (days === null) return "waiting";
  if (days < 7) return "waiting";
  if (days < 14) return "due";
  return "overdue";
}

function daysSince(date: string) {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor((TODAY.getTime() - parsed.getTime()) / 86_400_000);
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return new Map([...map.entries()].sort((a, b) => b[1] - a[1]));
}

function normalizeCompany(company: string) {
  return company.trim() || "Unknown";
}

function sanitizeNote(value: string) {
  return value.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

function parseApplicationsMarkdown(content: string, overlay: TrackerOverlay) {
  return content
    .split("\n")
    .filter((line) => /^\| \d+ \|/.test(line))
    .map(parseLine)
    .map((app) => mergeOverlay(app, overlay))
    .filter(Boolean) as Application[];
}

const localTrackerRepository: TrackerRepository = {
  mode: "local",
  loadApplications() {
    const content = existsSync(TRACKER_PATH) ? readFileSync(TRACKER_PATH, "utf8") : "";
    return parseApplicationsMarkdown(content, this.loadOverlay());
  },
  loadOverlay() {
    if (!existsSync(TRACKER_OVERLAY_PATH)) return {};
    const raw = readFileSync(TRACKER_OVERLAY_PATH, "utf8").trim();
    if (!raw) return {};
    return JSON.parse(raw) as TrackerOverlay;
  },
  saveOverlay(overlay) {
    assertWritableStorage();
    mkdirSync(dirname(TRACKER_OVERLAY_PATH), { recursive: true });
    writeFileSync(TRACKER_OVERLAY_PATH, JSON.stringify(overlay, null, 2), "utf8");
    return overlay;
  },
};

const asyncLocalTrackerRepository: AsyncTrackerRepository = {
  mode: "local",
  async loadApplications() {
    return localTrackerRepository.loadApplications();
  },
  async updateApplicationAction(input) {
    return updateApplicationAction(input);
  },
};

const blockedSyncPostgresTrackerRepository: TrackerRepository = {
  mode: "postgres",
  loadApplications() {
    assertDatabaseReady("Tracker repository");
  },
  loadOverlay() {
    assertDatabaseReady("Tracker event repository");
  },
  saveOverlay() {
    assertDatabaseReady("Tracker event repository");
  },
};

type ApplicationRow = {
  id: string;
  source_row_number: number | null;
  applied_on: string | null;
  company: string;
  role: string;
  score: string;
  status: string;
  notes: string;
  role_bucket: string;
  pipeline_status: PipelineStatus | null;
  action_notes: string | null;
  last_action_at: string | null;
};

const postgresTrackerRepository: AsyncTrackerRepository = {
  mode: "postgres",
  async loadApplications() {
    const profileId = await ensureActiveProfileDatabaseId();
    await seedPostgresApplications(profileId);
    const sql = getDatabaseSql();
    const rows = (await sql.query(
      `
        select
          a.id,
          a.source_row_number,
          a.applied_on::text,
          a.company,
          a.role,
          a.score,
          a.status,
          a.notes,
          a.role_bucket,
          e.pipeline_status,
          e.note as action_notes,
          e.created_at::text as last_action_at
        from applications a
        left join lateral (
          select pipeline_status, note, created_at
          from application_events
          where application_id = a.id
          order by created_at desc
          limit 1
        ) e on true
        where a.profile_id = $1
        order by coalesce(a.source_row_number, 999999), a.created_at asc
      `,
      [profileId],
    )) as ApplicationRow[];
    return rows.map(rowToApplication);
  },
  async updateApplicationAction(input) {
    const profileId = await ensureActiveProfileDatabaseId();
    await seedPostgresApplications(profileId);
    const sql = getDatabaseSql();
    const rows = (await sql.query(
      "select id, source_row_number, applied_on::text, company, role, score, status, notes, role_bucket from applications where profile_id = $1 and source_row_number = $2 limit 1",
      [profileId, input.num],
    )) as ApplicationRow[];
    const row = rows[0];
    if (!row) return null;

    const note = sanitizeNote(input.note || "");
    await sql.query(
      `
        insert into application_events (application_id, event_type, pipeline_status, note)
        values ($1, $2, $3, $4)
      `,
      [row.id, eventTypeForStatus(input.pipelineStatus), input.pipelineStatus, note],
    );
    await sql.query(
      "update applications set status = $1, updated_at = now() where id = $2",
      [input.pipelineStatus, row.id],
    );

    return {
      ...rowToApplication({
        ...row,
        pipeline_status: input.pipelineStatus,
        action_notes: note,
        last_action_at: new Date().toISOString(),
      }),
    };
  },
};

async function seedPostgresApplications(profileId: string) {
  const sql = getDatabaseSql();
  const countRows = (await sql.query(
    "select count(*)::int as count from applications where profile_id = $1",
    [profileId],
  )) as Array<{ count: number }>;
  if ((countRows[0]?.count || 0) > 0) return;

  const localApps = localTrackerRepository.loadApplications();
  for (const app of localApps) {
    await sql.query(
      `
        insert into applications (
          profile_id, source_row_number, applied_on, company, role, score, status, notes, role_bucket
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        on conflict (profile_id, source_row_number) do nothing
      `,
      [
        profileId,
        app.num,
        app.date || null,
        app.company,
        app.role,
        app.score,
        app.pipelineStatus || app.status || "applied",
        app.notes,
        app.bucket || classifyRole(app.role),
      ],
    );
  }
}

function rowToApplication(row: ApplicationRow): Application {
  const date = row.applied_on || "";
  const daysSinceApplication = daysSince(date);
  const base: Application = {
    num: row.source_row_number || 0,
    date,
    company: row.company,
    role: row.role,
    score: row.score,
    status: row.status,
    notes: row.notes,
    bucket: row.role_bucket || classifyRole(row.role),
    daysSinceApplication,
    urgency: classifyUrgency(daysSinceApplication),
  };

  if (!row.pipeline_status) return base;
  return {
    ...base,
    pipelineStatus: row.pipeline_status,
    actionNotes: row.action_notes || "",
    lastActionAt: row.last_action_at || undefined,
  };
}

function eventTypeForStatus(status: PipelineStatus) {
  if (status === "follow_up_sent") return "follow_up";
  if (status === "interview") return "interview";
  if (status === "rejected") return "rejection";
  if (status === "offer") return "offer";
  if (status === "closed") return "status_change";
  return "status_change";
}
