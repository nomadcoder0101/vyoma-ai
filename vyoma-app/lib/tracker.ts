import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { assertDatabaseReady } from "./database";
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

export function loadApplications(): Application[] {
  return getTrackerRepository().loadApplications();
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

export function getTrackerRepository(): TrackerRepository {
  const mode = getStorageMode();
  if (mode === "postgres") return postgresTrackerRepository;
  return localTrackerRepository;
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

const postgresTrackerRepository: TrackerRepository = {
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
