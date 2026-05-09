import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { assertDatabaseReady, getDatabaseSql } from "./database";
import { ensureActiveProfileDatabaseId } from "./profile";
import { recommendResume, recommendResumeAsync, type ResumeRecommendation } from "./resume-studio";
import { assertWritableStorage, getStorageMode, type StorageMode } from "./storage-adapter";

export type LeadType = "job" | "recruiter" | "company";

export type Lead = {
  id: string;
  type: LeadType;
  url: string;
  title: string;
  company: string;
  notes: string;
  status: "new" | "evaluated" | "drafted" | "contacted" | "archived";
  evaluation?: string;
  score?: number;
  nextAction?: string;
  outreachDraft?: string;
  resumeRecommendation?: ResumeRecommendation;
  createdAt: string;
  updatedAt: string;
};

const LEADS_PATH = join(process.cwd(), "..", "data", "leads.json");
const TRACKER_PATH = join(process.cwd(), "..", "data", "applications.md");

export type LeadRepository = {
  mode: StorageMode;
  load: () => Lead[];
  saveAll: (leads: Lead[]) => Lead[];
  appendToTracker: (lead: Lead) => { row: string };
};

export type AsyncLeadRepository = {
  mode: StorageMode;
  load: () => Promise<Lead[]>;
  add: (input: LeadInput) => Promise<Lead>;
  update: (
    id: string,
    action: "evaluate" | "draft" | "resume" | "contacted" | "archive" | "restore",
    resumeRecommendation?: ResumeRecommendation | null,
  ) => Promise<Lead | null>;
  convertToTracker: (id: string) => Promise<{ lead: Lead; trackerRow: string } | null>;
};

export type LeadInput = {
  type: LeadType;
  url: string;
  title?: string;
  company?: string;
  notes?: string;
};

export function loadLeads(): Lead[] {
  return getLeadRepository().load();
}

export async function loadLeadsAsync() {
  return getAsyncLeadRepository().load();
}

export function addLead(input: LeadInput) {
  const repository = getLeadRepository();
  const leads = repository.load();
  const now = new Date().toISOString();
  const lead: Lead = {
    id: `lead-${Date.now()}`,
    type: input.type,
    url: input.url.trim(),
    title: input.title?.trim() || inferTitle(input.url),
    company: input.company?.trim() || "",
    notes: input.notes?.trim() || "",
    status: "new",
    createdAt: now,
    updatedAt: now,
  };

  repository.saveAll([lead, ...leads]);
  return lead;
}

export async function addLeadAsync(input: LeadInput) {
  return getAsyncLeadRepository().add(input);
}

export function updateLead(
  id: string,
  action: "evaluate" | "draft" | "resume" | "contacted" | "archive" | "restore",
) {
  return updateLeadWithRecommendation(id, action);
}

export async function updateLeadAsync(
  id: string,
  action: "evaluate" | "draft" | "resume" | "contacted" | "archive" | "restore",
) {
  if (getStorageMode() === "postgres") {
    const recommendation = action === "resume" ? await recommendResumeAsyncForLead(id) : null;
    return getAsyncLeadRepository().update(id, action, recommendation);
  }
  if (action !== "resume") return updateLeadWithRecommendation(id, action);
  return updateLeadWithRecommendation(id, action, await recommendResumeAsyncForLead(id));
}

function updateLeadWithRecommendation(
  id: string,
  action: "evaluate" | "draft" | "resume" | "contacted" | "archive" | "restore",
  resumeRecommendation?: ResumeRecommendation | null,
) {
  const repository = getLeadRepository();
  const leads = repository.load();
  const index = leads.findIndex((lead) => lead.id === id);
  if (index === -1) return null;

  const lead = leads[index];
  const updated: Lead = {
    ...lead,
    updatedAt: new Date().toISOString(),
  };

  if (action === "evaluate") {
    updated.status = "evaluated";
    const evaluation = evaluateLead(lead);
    updated.evaluation = evaluation.text;
    updated.score = evaluation.score;
    updated.nextAction = evaluation.nextAction;
  }

  if (action === "draft") {
    updated.status = "drafted";
    updated.outreachDraft = draftOutreach(lead);
  }

  if (action === "resume") {
    updated.resumeRecommendation = resumeRecommendation || recommendResume(leadToResumeInput(lead));
    updated.nextAction = `Use ${updated.resumeRecommendation.recommended.name} before applying or contacting a recruiter.`;
  }

  if (action === "contacted") {
    updated.status = "contacted";
  }

  if (action === "archive") {
    updated.status = "archived";
  }

  if (action === "restore") {
    updated.status = "new";
  }

  leads[index] = updated;
  repository.saveAll(leads);
  return updated;
}

async function recommendResumeAsyncForLead(id: string) {
  const lead = (await loadLeadsAsync()).find((item) => item.id === id);
  if (!lead) return null;
  return recommendResumeAsync(leadToResumeInput(lead));
}

export function convertLeadToTracker(id: string) {
  const repository = getLeadRepository();
  const leads = repository.load();
  const index = leads.findIndex((lead) => lead.id === id);
  if (index === -1) return null;
  const lead = leads[index];

  const tracker = repository.appendToTracker(lead);

  const updated: Lead = {
    ...lead,
    status: "contacted",
    nextAction: "Added to tracker. Continue recruiter follow-up and update tracker outcome.",
    updatedAt: new Date().toISOString(),
  };
  leads[index] = updated;
  repository.saveAll(leads);
  return { lead: updated, trackerRow: tracker.row };
}

export async function convertLeadToTrackerAsync(id: string) {
  return getAsyncLeadRepository().convertToTracker(id);
}

export function getLeadRepository(): LeadRepository {
  const mode = getStorageMode();
  if (mode === "postgres") return blockedSyncPostgresLeadRepository;
  return localLeadRepository;
}

export function getAsyncLeadRepository(): AsyncLeadRepository {
  const mode = getStorageMode();
  if (mode === "postgres") return postgresLeadRepository;
  return asyncLocalLeadRepository;
}

export function leadSummary(leads: Lead[]) {
  return {
    total: leads.length,
    newCount: leads.filter((lead) => lead.status === "new").length,
    jobs: leads.filter((lead) => lead.type === "job").length,
    recruiters: leads.filter((lead) => lead.type === "recruiter").length,
    companies: leads.filter((lead) => lead.type === "company").length,
    recent: leads.slice(0, 6),
  };
}

function inferTitle(url: string) {
  if (url.includes("linkedin.com/jobs")) return "LinkedIn job lead";
  if (url.includes("linkedin.com/in")) return "LinkedIn recruiter/profile lead";
  if (url.includes("linkedin.com/company")) return "LinkedIn company lead";
  return "New lead";
}

function evaluateLead(lead: Lead) {
  const role = `${lead.title} ${lead.notes}`.toLowerCase();
  const positives = [];
  const cautions = [];
  let score = 2.5;

  if (/aml|financial crime|fincrime|fcc|cft/.test(role)) {
    positives.push("strong AML / financial crime keyword match");
    score += 0.7;
  }
  if (/kyc|kyb|cdd|edd|due diligence|onboarding/.test(role)) {
    positives.push("strong KYC / CDD / EDD fit");
    score += 0.7;
  }
  if (/transaction monitoring|surveillance|sar|str|smr/.test(role)) {
    positives.push("strong transaction monitoring or suspicious reporting fit");
    score += 0.8;
  }
  if (/senior|specialist|lead|manager|quality|checker/.test(role)) {
    positives.push("seniority appears aligned with 10+ years experience");
    score += 0.4;
  }
  if (/intern|graduate|junior|customer success|sales/.test(role)) {
    cautions.push("may be too junior, broad, or outside AML/FCC core");
    score -= 0.9;
  }
  if (/crypto|web3/.test(role)) {
    cautions.push("crypto/Web3 role needs extra scrutiny for stability and compliance scope");
    score -= 0.2;
  }
  if (/singapore|remote|apac|australia|new zealand/.test(role)) {
    positives.push("matches expanded Singapore / remote APAC strategy");
    score += 0.3;
  }
  if (/sponsor|employment pass|visa|work authorization/.test(role)) {
    positives.push("contains work authorization language worth reviewing carefully");
    score += 0.2;
  }

  score = Math.max(1, Math.min(5, Math.round(score * 10) / 10));
  const positiveText = positives.length
    ? positives.join("; ")
    : "needs manual review against the JD";
  const cautionText = cautions.length ? ` Caution: ${cautions.join("; ")}.` : "";
  const nextAction =
    score >= 4
      ? "High priority: open the link, confirm sponsorship/location language, then draft outreach."
      : score >= 3
        ? "Review manually: confirm AML/FCC scope and work authorization fit before outreach."
        : "Low priority: archive unless there is a strong external reason to pursue.";

  return {
    score,
    nextAction,
    text: `Score: ${score}/5. Initial fit: ${positiveText}.${cautionText} Next step: ${nextAction}`,
  };
}

function draftOutreach(lead: Lead) {
  const role = lead.title || "[Role]";
  const company = lead.company || "[Company]";

  if (lead.type === "recruiter") {
    return `Hi [Name], I came across your profile while looking at AML / Financial Crime Compliance opportunities. I am helping Samruddhi, a senior AML/KYC professional with 10+ years across transaction monitoring, KYC/CDD/EDD, SAR/STR reporting, and compliance QA. She is based in Kuala Lumpur and available immediately. Would you be the right person to connect with for AML/FCC roles at ${company}?`;
  }

  if (lead.type === "company") {
    return `Hi [Name], I am exploring AML / Financial Crime Compliance opportunities with ${company}. Samruddhi has 10+ years of AML/KYC, transaction monitoring, SAR/STR reporting, and compliance QA experience across global banks and consulting firms. She is based in Kuala Lumpur and available immediately. Could you point me to the right recruiter or hiring team?`;
  }

  return `Hi [Name], I recently found the ${role} role at ${company}. Samruddhi is a senior AML / Financial Crime Compliance professional with 10+ years across transaction monitoring, KYC/CDD/EDD, SAR/STR reporting, and compliance QA. She is based in Kuala Lumpur and available immediately. Could you let me know who would be the right recruiter or hiring manager to speak with about this role?`;
}

function leadToResumeInput(lead: Lead) {
  return [
    lead.title,
    lead.company,
    lead.notes,
  ].join(" ");
}

function sanitizeCell(value: string) {
  return value.replace(/\r?\n/g, " ").replace(/\|/g, "/").replace(/\s+/g, " ").trim();
}

function normalizeLeads(value: unknown) {
  return Array.isArray(value) ? (value as Lead[]) : [];
}

function buildTrackerRow(lead: Lead, nextNum: number) {
  const today = new Date().toISOString().slice(0, 10);
  const company = sanitizeCell(lead.company || "Unknown");
  const role = sanitizeCell(lead.title || inferTitle(lead.url));
  const notes = sanitizeCell(
    [
      `Converted from lead ${lead.id}`,
      `Type: ${lead.type}`,
      `URL: ${lead.url}`,
      lead.notes ? `Notes: ${lead.notes}` : "",
      lead.score ? `Lead score: ${lead.score}/5` : "",
      lead.resumeRecommendation
        ? `Resume: ${lead.resumeRecommendation.recommended.name} (${lead.resumeRecommendation.score}/5)`
        : "",
    ]
      .filter(Boolean)
      .join("; "),
  );

  return `| ${nextNum} | ${today} | ${company} | ${role} | N/A | applied | - | - | ${notes} |`;
}

const localLeadRepository: LeadRepository = {
  mode: "local",
  load() {
    if (!existsSync(LEADS_PATH)) return [];
    const raw = readFileSync(LEADS_PATH, "utf8").trim();
    if (!raw) return [];
    return normalizeLeads(JSON.parse(raw));
  },
  saveAll(leads) {
    assertWritableStorage();
    mkdirSync(dirname(LEADS_PATH), { recursive: true });
    writeFileSync(LEADS_PATH, JSON.stringify(leads, null, 2), "utf8");
    return leads;
  },
  appendToTracker(lead) {
    assertWritableStorage();
    const content = existsSync(TRACKER_PATH) ? readFileSync(TRACKER_PATH, "utf8") : "";
    const rows = content
      .split("\n")
      .filter((line) => /^\| \d+ \|/.test(line))
      .map((line) => Number(line.split("|")[1]?.trim()))
      .filter(Number.isFinite);
    const nextNum = rows.length ? Math.max(...rows) + 1 : 1;
    const row = buildTrackerRow(lead, nextNum);
    const nextContent = content.trim()
      ? `${content.trimEnd()}\n${row}\n`
      : [
          "# Application Tracker",
          "",
          "| # | Fecha | Empresa | Rol | Score | Estado | PDF | Report | Notes |",
          "|---|-------|---------|-----|-------|--------|-----|--------|-------|",
          row,
          "",
        ].join("\n");

    writeFileSync(TRACKER_PATH, nextContent, "utf8");
    return { row };
  },
};

const asyncLocalLeadRepository: AsyncLeadRepository = {
  mode: "local",
  async load() {
    return localLeadRepository.load();
  },
  async add(input) {
    return addLead(input);
  },
  async update(id, action, resumeRecommendation) {
    return updateLeadWithRecommendation(id, action, resumeRecommendation);
  },
  async convertToTracker(id) {
    return convertLeadToTracker(id);
  },
};

const blockedSyncPostgresLeadRepository: LeadRepository = {
  mode: "postgres",
  load() {
    assertDatabaseReady("Lead repository sync access");
  },
  saveAll() {
    assertDatabaseReady("Lead repository sync access");
  },
  appendToTracker() {
    assertDatabaseReady("Lead-to-tracker sync conversion");
  },
};

type LeadRow = {
  id: string;
  type: LeadType;
  url: string;
  title: string;
  company: string;
  notes: string;
  status: Lead["status"];
  score: string | number | null;
  evaluation: string | null;
  next_action: string | null;
  outreach_draft: string | null;
  resume_recommendation: ResumeRecommendation | null;
  created_at: string;
  updated_at: string;
};

const postgresLeadRepository: AsyncLeadRepository = {
  mode: "postgres",
  async load() {
    const profileId = await ensureActiveProfileDatabaseId();
    const sql = getDatabaseSql();
    const rows = (await sql.query(
      "select id, type, url, title, company, notes, status, score, evaluation, next_action, outreach_draft, resume_recommendation, created_at, updated_at from leads where profile_id = $1 order by created_at desc",
      [profileId],
    )) as LeadRow[];
    return rows.map(rowToLead);
  },
  async add(input) {
    const profileId = await ensureActiveProfileDatabaseId();
    const sql = getDatabaseSql();
    const now = new Date().toISOString();
    const rows = (await sql.query(
      "insert into leads (profile_id, type, url, title, company, notes, status, created_at, updated_at) values ($1, $2, $3, $4, $5, $6, 'new', $7, $7) returning id, type, url, title, company, notes, status, score, evaluation, next_action, outreach_draft, resume_recommendation, created_at, updated_at",
      [
        profileId,
        input.type,
        input.url.trim(),
        input.title?.trim() || inferTitle(input.url),
        input.company?.trim() || "",
        input.notes?.trim() || "",
        now,
      ],
    )) as LeadRow[];
    return rowToLead(rows[0]);
  },
  async update(id, action, resumeRecommendation) {
    const profileId = await ensureActiveProfileDatabaseId();
    const sql = getDatabaseSql();
    const rows = (await sql.query(
      "select id, type, url, title, company, notes, status, score, evaluation, next_action, outreach_draft, resume_recommendation, created_at, updated_at from leads where profile_id = $1 and id = $2 limit 1",
      [profileId, id],
    )) as LeadRow[];
    if (!rows[0]) return null;

    const updated = applyLeadAction(rowToLead(rows[0]), action, resumeRecommendation);
    const saved = (await sql.query(
      "update leads set status = $1, score = $2, evaluation = $3, next_action = $4, outreach_draft = $5, resume_recommendation = $6::jsonb, updated_at = $7 where profile_id = $8 and id = $9 returning id, type, url, title, company, notes, status, score, evaluation, next_action, outreach_draft, resume_recommendation, created_at, updated_at",
      [
        updated.status,
        updated.score ?? null,
        updated.evaluation ?? null,
        updated.nextAction ?? null,
        updated.outreachDraft ?? null,
        updated.resumeRecommendation ? JSON.stringify(updated.resumeRecommendation) : null,
        updated.updatedAt,
        profileId,
        id,
      ],
    )) as LeadRow[];
    return rowToLead(saved[0]);
  },
  async convertToTracker(id) {
    const profileId = await ensureActiveProfileDatabaseId();
    const sql = getDatabaseSql();
    const rows = (await sql.query(
      "select id, type, url, title, company, notes, status, score, evaluation, next_action, outreach_draft, resume_recommendation, created_at, updated_at from leads where profile_id = $1 and id = $2 limit 1",
      [profileId, id],
    )) as LeadRow[];
    if (!rows[0]) return null;

    const lead = rowToLead(rows[0]);
    const numberRows = (await sql.query(
      "select coalesce(max(source_row_number), 0)::int + 1 as next_number from applications where profile_id = $1",
      [profileId],
    )) as Array<{ next_number: number }>;
    const nextNumber = numberRows[0]?.next_number || 1;
    const application = (await sql.query(
      "insert into applications (profile_id, source_row_number, applied_on, company, role, url, score, status, notes, role_bucket) values ($1, $2, $3, $4, $5, $6, $7, 'applied', $8, $9) returning source_row_number, company, role",
      [
        profileId,
        nextNumber,
        new Date().toISOString().slice(0, 10),
        sanitizeCell(lead.company || "Unknown"),
        sanitizeCell(lead.title || inferTitle(lead.url)),
        lead.url,
        lead.score ? String(lead.score) : "N/A",
        sanitizeCell(
          [
            `Converted from lead ${lead.id}`,
            `Type: ${lead.type}`,
            lead.notes ? `Notes: ${lead.notes}` : "",
            lead.resumeRecommendation
              ? `Resume: ${lead.resumeRecommendation.recommended.name} (${lead.resumeRecommendation.score}/5)`
              : "",
          ]
            .filter(Boolean)
            .join("; "),
        ),
        classifyLeadRoleBucket(lead),
      ],
    )) as Array<{ source_row_number: number | null; company: string; role: string }>;

    const updated = await this.update(id, "contacted");
    if (!updated) return null;
    const trackerRow = `Postgres application created: ${application[0].company} | ${application[0].role}`;
    return { lead: updated, trackerRow };
  },
};

function applyLeadAction(
  lead: Lead,
  action: "evaluate" | "draft" | "resume" | "contacted" | "archive" | "restore",
  resumeRecommendation?: ResumeRecommendation | null,
) {
  const updated: Lead = {
    ...lead,
    updatedAt: new Date().toISOString(),
  };

  if (action === "evaluate") {
    updated.status = "evaluated";
    const evaluation = evaluateLead(lead);
    updated.evaluation = evaluation.text;
    updated.score = evaluation.score;
    updated.nextAction = evaluation.nextAction;
  }

  if (action === "draft") {
    updated.status = "drafted";
    updated.outreachDraft = draftOutreach(lead);
  }

  if (action === "resume") {
    updated.resumeRecommendation = resumeRecommendation || recommendResume(leadToResumeInput(lead));
    updated.nextAction = `Use ${updated.resumeRecommendation.recommended.name} before applying or contacting a recruiter.`;
  }

  if (action === "contacted") updated.status = "contacted";
  if (action === "archive") updated.status = "archived";
  if (action === "restore") updated.status = "new";

  return updated;
}

function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    type: row.type,
    url: row.url,
    title: row.title,
    company: row.company,
    notes: row.notes,
    status: row.status,
    score: row.score === null ? undefined : Number(row.score),
    evaluation: row.evaluation || undefined,
    nextAction: row.next_action || undefined,
    outreachDraft: row.outreach_draft || undefined,
    resumeRecommendation: row.resume_recommendation || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function classifyLeadRoleBucket(lead: Lead) {
  const text = `${lead.title} ${lead.notes}`.toLowerCase();
  if (/transaction monitoring|surveillance|alert|tm/.test(text)) return "Transaction Monitoring / Surveillance";
  if (/kyc|kyb|cdd|edd|due diligence|onboarding/.test(text)) return "KYC / CDD / EDD / Onboarding";
  if (/financial crime|aml|fcc|cft/.test(text)) return "AML / Financial Crime Compliance";
  if (/fraud|risk/.test(text)) return "Fraud / Risk adjacent";
  return "Other compliance / unclear";
}
