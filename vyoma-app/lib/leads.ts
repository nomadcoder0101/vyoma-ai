import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { assertDatabaseReady } from "./database";
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

export function loadLeads(): Lead[] {
  return getLeadRepository().load();
}

export function addLead(input: {
  type: LeadType;
  url: string;
  title?: string;
  company?: string;
  notes?: string;
}) {
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
  const lead = getLeadRepository().load().find((item) => item.id === id);
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

export function getLeadRepository(): LeadRepository {
  const mode = getStorageMode();
  if (mode === "postgres") return postgresLeadRepository;
  return localLeadRepository;
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

const postgresLeadRepository: LeadRepository = {
  mode: "postgres",
  load() {
    assertDatabaseReady("Lead repository");
  },
  saveAll() {
    assertDatabaseReady("Lead repository");
  },
  appendToTracker() {
    assertDatabaseReady("Lead-to-tracker conversion");
  },
};
