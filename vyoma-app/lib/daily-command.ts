import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { assertDatabaseReady, getDatabaseSql } from "./database";
import { loadLeads, loadLeadsAsync } from "./leads";
import { ensureActiveProfileDatabaseId } from "./profile";
import { assertWritableStorage, getStorageMode, type StorageMode } from "./storage-adapter";
import { loadApplications, loadApplicationsAsync, trackerSummary } from "./tracker";

export type DailyAction = {
  id: string;
  title: string;
  detail: string;
  type: "follow_up" | "lead_review" | "search" | "resume" | "outreach";
  href: string;
  priority: "high" | "medium" | "low";
  done: boolean;
};

export type DailyCommand = {
  date: string;
  actions: DailyAction[];
  completedIds: string[];
};

const DAILY_PATH = join(process.cwd(), "..", "data", "daily-actions.json");

export type DailyData = Record<string, string[]>;

export type DailyCommandRepository = {
  mode: StorageMode;
  loadData: () => DailyData;
  saveData: (data: DailyData) => DailyData;
};

export type AsyncDailyCommandRepository = {
  mode: StorageMode;
  loadData: () => Promise<DailyData>;
  saveData: (data: DailyData) => Promise<DailyData>;
};

export function loadDailyCommand() {
  const date = todayString();
  const repository = getDailyCommandRepository();
  const completedIds = repository.loadData()[date] || [];
  const apps = loadApplications();
  const summary = trackerSummary(apps);
  const leads = loadLeads();
  const newLeads = leads.filter((lead) => lead.status === "new");
  const resumeMissing = leads.filter(
    (lead) => lead.status !== "archived" && !lead.resumeRecommendation,
  );

  const actions: DailyAction[] = [
    ...summary.followUps.slice(0, 5).map((app) => ({
      id: `follow-up-${app.num}`,
      title: `Follow up: ${app.company}`,
      detail: `${app.role} | Applied ${app.date}${app.daysSinceApplication !== null ? ` (${app.daysSinceApplication} days ago)` : ""}`,
      type: "follow_up" as const,
      href: "/tracker",
      priority: "high" as const,
      done: false,
    })),
    ...newLeads.slice(0, 4).map((lead) => ({
      id: `lead-review-${lead.id}`,
      title: `Review lead: ${lead.title}`,
      detail: `${lead.company || "Company not set"} | Evaluate, draft outreach, and decide whether to track.`,
      type: "lead_review" as const,
      href: "/leads",
      priority: "high" as const,
      done: false,
    })),
    ...resumeMissing.slice(0, 3).map((lead) => ({
      id: `resume-${lead.id}`,
      title: `Pick resume for: ${lead.title}`,
      detail: `${lead.company || "Company not set"} | Run resume recommendation before applying.`,
      type: "resume" as const,
      href: "/leads",
      priority: "medium" as const,
      done: false,
    })),
    {
      id: "search-kl-recruiters",
      title: "Run KL AML recruiter search",
      detail: "Capture 3 recruiter or TA profiles into Leads.",
      type: "search" as const,
      href: "/daily-plan#searches",
      priority: "medium" as const,
      done: false,
    },
    {
      id: "search-singapore-kyc",
      title: "Run Singapore KYC role search",
      detail: "Capture high-fit KYC/CDD/EDD roles and check work authorization language.",
      type: "search" as const,
      href: "/daily-plan#searches",
      priority: "medium" as const,
      done: false,
    },
    {
      id: "outreach-one",
      title: "Send one recruiter/referral outreach",
      detail: "Use a drafted message from Leads or Assistant. Human sends manually.",
      type: "outreach" as const,
      href: "/assistant",
      priority: "low" as const,
      done: false,
    },
  ].slice(0, 14);

  const withStatus = actions.map((action) => ({
    ...action,
    done: completedIds.includes(action.id),
  }));

  return {
    date,
    actions: withStatus,
    completedIds,
  };
}

export async function loadDailyCommandAsync() {
  const date = todayString();
  const repository = getAsyncDailyCommandRepository();
  const completedIds = (await repository.loadData())[date] || [];
  const apps = await loadApplicationsAsync();
  const summary = trackerSummary(apps);
  const leads = await loadLeadsAsync();
  return buildDailyCommand(date, completedIds, summary, leads);
}

export function updateDailyAction(id: string, done: boolean) {
  const repository = getDailyCommandRepository();
  const command = loadDailyCommand();
  const completedIds = new Set(command.completedIds);
  if (done) {
    completedIds.add(id);
  } else {
    completedIds.delete(id);
  }

  const data = repository.loadData();
  data[command.date] = Array.from(completedIds);
  repository.saveData(data);

  return loadDailyCommand();
}

export async function updateDailyActionAsync(id: string, done: boolean) {
  const repository = getAsyncDailyCommandRepository();
  const command = await loadDailyCommandAsync();
  const completedIds = new Set(command.completedIds);
  if (done) {
    completedIds.add(id);
  } else {
    completedIds.delete(id);
  }

  const data = await repository.loadData();
  data[command.date] = Array.from(completedIds);
  await repository.saveData(data);

  return loadDailyCommandAsync();
}

function buildDailyCommand(
  date: string,
  completedIds: string[],
  summary: ReturnType<typeof trackerSummary>,
  leads: ReturnType<typeof loadLeads>,
) {
  const newLeads = leads.filter((lead) => lead.status === "new");
  const resumeMissing = leads.filter(
    (lead) => lead.status !== "archived" && !lead.resumeRecommendation,
  );

  const actions: DailyAction[] = [
    ...summary.followUps.slice(0, 5).map((app) => ({
      id: `follow-up-${app.num}`,
      title: `Follow up: ${app.company}`,
      detail: `${app.role} | Applied ${app.date}${app.daysSinceApplication !== null ? ` (${app.daysSinceApplication} days ago)` : ""}`,
      type: "follow_up" as const,
      href: "/tracker",
      priority: "high" as const,
      done: false,
    })),
    ...newLeads.slice(0, 4).map((lead) => ({
      id: `lead-review-${lead.id}`,
      title: `Review lead: ${lead.title}`,
      detail: `${lead.company || "Company not set"} | Evaluate, draft outreach, and decide whether to track.`,
      type: "lead_review" as const,
      href: "/leads",
      priority: "high" as const,
      done: false,
    })),
    ...resumeMissing.slice(0, 3).map((lead) => ({
      id: `resume-${lead.id}`,
      title: `Pick resume for: ${lead.title}`,
      detail: `${lead.company || "Company not set"} | Run resume recommendation before applying.`,
      type: "resume" as const,
      href: "/leads",
      priority: "medium" as const,
      done: false,
    })),
    {
      id: "search-kl-recruiters",
      title: "Run KL AML recruiter search",
      detail: "Capture 3 recruiter or TA profiles into Leads.",
      type: "search" as const,
      href: "/daily-plan#searches",
      priority: "medium" as const,
      done: false,
    },
    {
      id: "search-singapore-kyc",
      title: "Run Singapore KYC role search",
      detail: "Capture high-fit KYC/CDD/EDD roles and check work authorization language.",
      type: "search" as const,
      href: "/daily-plan#searches",
      priority: "medium" as const,
      done: false,
    },
    {
      id: "outreach-one",
      title: "Send one recruiter/referral outreach",
      detail: "Use a drafted message from Leads or Assistant. Human sends manually.",
      type: "outreach" as const,
      href: "/assistant",
      priority: "low" as const,
      done: false,
    },
  ].slice(0, 14);

  return {
    date,
    actions: actions.map((action) => ({
      ...action,
      done: completedIds.includes(action.id),
    })),
    completedIds,
  };
}

export function getDailyCommandRepository(): DailyCommandRepository {
  const mode = getStorageMode();
  if (mode === "postgres") return blockedSyncPostgresDailyCommandRepository;
  return localDailyCommandRepository;
}

export function getAsyncDailyCommandRepository(): AsyncDailyCommandRepository {
  const mode = getStorageMode();
  if (mode === "postgres") return postgresDailyCommandRepository;
  return asyncLocalDailyCommandRepository;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDailyData(value: unknown): DailyData {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as DailyData;
}

const localDailyCommandRepository: DailyCommandRepository = {
  mode: "local",
  loadData() {
    if (!existsSync(DAILY_PATH)) return {};
    const raw = readFileSync(DAILY_PATH, "utf8").trim();
    if (!raw) return {};
    return normalizeDailyData(JSON.parse(raw));
  },
  saveData(data) {
    assertWritableStorage();
    mkdirSync(dirname(DAILY_PATH), { recursive: true });
    writeFileSync(DAILY_PATH, JSON.stringify(data, null, 2), "utf8");
    return data;
  },
};

const asyncLocalDailyCommandRepository: AsyncDailyCommandRepository = {
  mode: "local",
  async loadData() {
    return localDailyCommandRepository.loadData();
  },
  async saveData(data) {
    return localDailyCommandRepository.saveData(data);
  },
};

const blockedSyncPostgresDailyCommandRepository: DailyCommandRepository = {
  mode: "postgres",
  loadData() {
    assertDatabaseReady("Daily command repository");
  },
  saveData() {
    assertDatabaseReady("Daily command repository");
  },
};

const postgresDailyCommandRepository: AsyncDailyCommandRepository = {
  mode: "postgres",
  async loadData() {
    const profileId = await ensureActiveProfileDatabaseId();
    const sql = getDatabaseSql();
    const rows = (await sql.query(
      "select task_date::text, action_id from daily_tasks where profile_id = $1 and completed_at is not null order by task_date desc, created_at asc",
      [profileId],
    )) as Array<{ task_date: string; action_id: string }>;

    return rows.reduce<DailyData>((data, row) => {
      data[row.task_date] = [...(data[row.task_date] || []), row.action_id];
      return data;
    }, {});
  },
  async saveData(data) {
    const profileId = await ensureActiveProfileDatabaseId();
    const sql = getDatabaseSql();

    for (const [date, completedIds] of Object.entries(data)) {
      await sql.query(
        "delete from daily_tasks where profile_id = $1 and task_date = $2 and completed_at is not null and action_id <> all($3::text[])",
        [profileId, date, completedIds],
      );

      for (const actionId of completedIds) {
        await sql.query(
          `
            insert into daily_tasks (profile_id, task_date, action_id, type, title, detail, href, completed_at)
            values ($1, $2, $3, $4, $5, $6, $7, now())
            on conflict (profile_id, task_date, action_id)
            do update set completed_at = excluded.completed_at
          `,
          [
            profileId,
            date,
            actionId,
            dailyTaskTypeForActionId(actionId),
            actionId,
            "Completed from daily command UI.",
            dailyTaskHrefForActionId(actionId),
          ],
        );
      }
    }

    return data;
  },
};

function dailyTaskTypeForActionId(actionId: string) {
  if (actionId.startsWith("follow-up-")) return "follow_up";
  if (actionId.startsWith("lead-review-")) return "lead";
  if (actionId.startsWith("resume-")) return "resume";
  if (actionId.startsWith("search-")) return "search";
  return "outreach";
}

function dailyTaskHrefForActionId(actionId: string) {
  if (actionId.startsWith("follow-up-")) return "/tracker";
  if (actionId.startsWith("lead-review-")) return "/leads";
  if (actionId.startsWith("resume-")) return "/leads";
  if (actionId.startsWith("search-")) return "/daily-plan#searches";
  return "/assistant";
}
