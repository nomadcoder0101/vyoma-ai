import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { assertDatabaseConfigured, getDatabaseSql } from "./database";
import { assertWritableStorage, getStorageMode, type StorageMode } from "./storage-adapter";

export type ResumeTemplate = {
  name: string;
  focus: string;
  notes: string;
};

export type CareerProfile = {
  id: string;
  candidateName: string;
  headline: string;
  currentLocation: string;
  workAuthorization: string;
  salaryExpectation: string;
  targetLocations: string[];
  targetRoles: string[];
  coreSkills: string[];
  profileDescription: string;
  reasonForChange: string;
  constraints: string[];
  resumeTemplates: ResumeTemplate[];
  confirmed: boolean;
  memory: string[];
  agentNotes: AgentNote[];
  createdAt: string;
  updatedAt: string;
};

export type AgentNote = {
  id: string;
  type: "strength" | "risk" | "next_step" | "learning";
  text: string;
  createdAt: string;
};

const PROFILE_PATH = join(process.cwd(), "..", "data", "profiles", "samruddhi.json");

export type ProfileRepository = {
  mode: StorageMode;
  load: () => CareerProfile;
  save: (profile: CareerProfile) => CareerProfile;
};

export type AsyncProfileRepository = {
  mode: StorageMode;
  load: () => Promise<CareerProfile>;
  save: (profile: CareerProfile) => Promise<CareerProfile>;
};

export const defaultProfile: CareerProfile = {
  id: "samruddhi-chougule",
  candidateName: "Samruddhi Suresh Chougule",
  headline: "Senior AML / KYC / Financial Crime Compliance professional with 10+ years of experience",
  currentLocation: "Kuala Lumpur, Malaysia",
  workAuthorization:
    "Based in Malaysia on Dependent Pass; requires employer-sponsored Employment Pass conversion/sponsorship.",
  salaryExpectation: "Flexible; up to MYR 10,000 per month is acceptable for the right Malaysia role.",
  targetLocations: [
    "Kuala Lumpur, Malaysia",
    "Singapore",
    "Remote APAC",
    "Remote Australia",
    "Remote New Zealand",
  ],
  targetRoles: [
    "AML Investigations",
    "KYC / CDD / EDD / ECDD",
    "Transaction Monitoring",
    "SAR / STR / SMR Reporting",
    "Financial Crime Compliance",
    "Compliance QA / Checker",
  ],
  coreSkills: [
    "AML lifecycle",
    "Transaction monitoring alerts",
    "Suspicious activity reporting",
    "KYC refresh and onboarding",
    "Enhanced due diligence",
    "Sanctions, PEP, and adverse media review",
    "Regulatory documentation",
    "Global banking and consulting environments",
  ],
  profileDescription:
    "Samruddhi has 10+ years of AML/KYC and Financial Crime Compliance experience across global banks and consulting firms. Her strongest positioning is senior analyst/specialist work across transaction monitoring, CDD/EDD/ECDD, suspicious reporting, and compliance quality review.",
  reasonForChange:
    "She has relocated from Bangalore to Kuala Lumpur to join her partner and is seeking a role that lets her continue her AML/FCC career in Malaysia, Singapore, or remote APAC markets.",
  constraints: [
    "Malaysia roles need Employment Pass sponsorship.",
    "Search should prioritize sponsor-capable employers such as global banks, consulting firms, large fintechs, and shared-service centers.",
    "Remote roles from Australia, New Zealand, Singapore, and APAC are acceptable if work authorization terms fit.",
  ],
  resumeTemplates: [
    {
      name: "Financial Crime Reporting",
      focus: "SAR/STR/SMR, investigation writing, regulatory reporting",
      notes: "Use for reporting-heavy AML investigations and financial crime analyst roles.",
    },
    {
      name: "Financial Crime Compliance",
      focus: "AML/FCC lifecycle, controls, compliance QA, stakeholder documentation",
      notes: "Use for broader compliance roles at banks, consulting firms, and fintechs.",
    },
    {
      name: "KYC Operations",
      focus: "KYC, CDD, EDD/ECDD, onboarding, refresh, beneficial ownership",
      notes: "Use for KYC operations, onboarding, client due diligence, and review roles.",
    },
    {
      name: "ECDD & Transaction Monitoring",
      focus: "ECDD, transaction monitoring alerts, AML investigation workflow",
      notes: "Use for transaction monitoring, alert review, and AML investigation roles.",
    },
  ],
  confirmed: false,
  memory: [
    "Existing tracker has a large application history, so follow-up discipline matters as much as new applications.",
    "Visa sponsorship is the main friction; outreach should foreground capability first and handle authorization clearly.",
    "Separate positioning is needed for KYC/ECDD, transaction monitoring, and reporting-heavy roles.",
  ],
  agentNotes: [
    {
      id: "note-sponsorship",
      type: "risk",
      text: "Malaysia Employment Pass sponsorship is the biggest search constraint; target sponsor-capable employers first.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "note-positioning",
      type: "strength",
      text: "The strongest positioning is senior AML/FCC work with KYC/ECDD, transaction monitoring, and suspicious reporting.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "note-daily-rhythm",
      type: "next_step",
      text: "Each day should start with follow-ups, then lead capture, then outreach for high-fit roles.",
      createdAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function loadProfile() {
  return getProfileRepository().load();
}

export function saveProfile(profile: CareerProfile) {
  return getProfileRepository().save(profile);
}

export async function loadProfileAsync() {
  return getAsyncProfileRepository().load();
}

export async function saveProfileAsync(profile: CareerProfile) {
  return getAsyncProfileRepository().save(profile);
}

export function getProfileRepository(): ProfileRepository {
  const mode = getStorageMode();
  if (mode === "postgres") return blockedSyncPostgresProfileRepository;
  return localProfileRepository;
}

export function getAsyncProfileRepository(): AsyncProfileRepository {
  const mode = getStorageMode();
  if (mode === "postgres") return postgresProfileRepository;
  return asyncLocalProfileRepository;
}

export function profileCompleteness(profile: CareerProfile) {
  const checks = [
    profile.candidateName,
    profile.headline,
    profile.currentLocation,
    profile.workAuthorization,
    profile.targetLocations.length,
    profile.targetRoles.length,
    profile.coreSkills.length,
    profile.profileDescription,
    profile.reasonForChange,
    profile.resumeTemplates.length,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function profileSummary(profile: CareerProfile) {
  return `${profile.candidateName} is positioned as ${profile.headline}. Target markets: ${profile.targetLocations.join(", ")}. Target roles: ${profile.targetRoles.join(", ")}. Authorization: ${profile.workAuthorization}`;
}

export function applyAgentInstruction(profile: CareerProfile, instruction: string) {
  const text = instruction.toLowerCase();
  const nextProfile: CareerProfile = {
    ...profile,
    confirmed: false,
    updatedAt: new Date().toISOString(),
  };

  if (text.includes("singapore")) {
    nextProfile.targetLocations = unique([
      "Singapore",
      ...nextProfile.targetLocations,
    ]);
    nextProfile.profileDescription =
      "Samruddhi should be positioned for Singapore and APAC AML/FCC roles by emphasizing global-bank exposure, KYC/CDD/EDD depth, transaction monitoring, suspicious reporting, and readiness for cross-border compliance environments.";
    nextProfile.memory = unique([
      "Singapore roles should be approached as both local opportunities and regional APAC compliance roles.",
      ...nextProfile.memory,
    ]);
  }

  if (text.includes("sponsor") || text.includes("visa") || text.includes("employment pass")) {
    nextProfile.workAuthorization =
      "Currently based in Kuala Lumpur on a Dependent Pass and eligible to move forward with employer-sponsored Employment Pass conversion. Outreach should lead with AML/FCC value first, then state sponsorship needs clearly when relevant.";
    nextProfile.constraints = unique([
      "Do not over-lead with sponsorship in first-touch outreach; establish fit first, then clarify Employment Pass requirements.",
      ...nextProfile.constraints,
    ]);
  }

  if (text.includes("kyc") || text.includes("cdd") || text.includes("edd")) {
    nextProfile.targetRoles = unique([
      "KYC / CDD / EDD / ECDD",
      "Client Due Diligence Analyst",
      "KYC Quality Review / Checker",
      ...nextProfile.targetRoles,
    ]);
    nextProfile.profileDescription =
      "Samruddhi has a strong KYC operations profile across CDD, EDD/ECDD, onboarding/refresh, beneficial ownership review, sanctions/PEP/adverse media checks, and regulatory-quality documentation.";
  }

  if (text.includes("transaction") || text.includes("monitoring") || text.includes("sar") || text.includes("str")) {
    nextProfile.targetRoles = unique([
      "Transaction Monitoring",
      "AML Investigations",
      "SAR / STR / SMR Reporting",
      ...nextProfile.targetRoles,
    ]);
    nextProfile.profileDescription =
      "Samruddhi should be positioned as a senior AML investigations and transaction monitoring professional with strong alert review, escalation judgment, SAR/STR/SMR documentation, and financial crime reporting experience.";
  }

  if (text.includes("remote") || text.includes("australia") || text.includes("new zealand") || text.includes("apac")) {
    nextProfile.targetLocations = unique([
      "Remote APAC",
      "Remote Australia",
      "Remote New Zealand",
      ...nextProfile.targetLocations,
    ]);
    nextProfile.memory = unique([
      "Remote APAC searches should focus on AML/FCC roles that accept Malaysia-based candidates or contractor arrangements.",
      ...nextProfile.memory,
    ]);
  }

  if (text.includes("stronger") || text.includes("improve") || text.includes("sharper")) {
    nextProfile.headline =
      "Senior AML / KYC / Financial Crime Compliance specialist for global banking, ECDD, transaction monitoring, and suspicious reporting";
    nextProfile.coreSkills = unique([
      "Senior AML investigation judgment",
      "Regulatory-quality case documentation",
      "KYC/CDD/EDD/ECDD risk review",
      "Transaction monitoring alert disposition",
      ...nextProfile.coreSkills,
    ]);
  }

  const changeNote = summarizeAgentInstruction(instruction);
  const agentNote: AgentNote = {
    id: `note-${Date.now()}`,
    type: "learning",
    text: changeNote,
    createdAt: new Date().toISOString(),
  };
  nextProfile.agentNotes = [
    agentNote,
    ...(nextProfile.agentNotes || []),
  ].slice(0, 12);

  return nextProfile;
}

export function profileImprovementSuggestions(profile: CareerProfile) {
  const suggestions = [];
  const profileText = [
    profile.headline,
    profile.profileDescription,
    profile.workAuthorization,
    profile.targetRoles.join(" "),
    profile.targetLocations.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  if (!profile.confirmed) {
    suggestions.push("Confirm the profile before using it as the source for lead scoring and outreach.");
  }
  if (!profileText.includes("sponsor") && !profileText.includes("employment pass")) {
    suggestions.push("Add Employment Pass sponsorship wording so Malaysia opportunities are evaluated realistically.");
  }
  if (!profileText.includes("singapore")) {
    suggestions.push("Add Singapore as a distinct target market with separate outreach positioning.");
  }
  if (!profileText.includes("transaction monitoring")) {
    suggestions.push("Keep transaction monitoring visible because it is one of the clearest AML role matches.");
  }
  if (profile.resumeTemplates.length < 3) {
    suggestions.push("Map at least three resume variants: KYC/ECDD, transaction monitoring, and reporting-heavy AML.");
  }

  return suggestions.slice(0, 5);
}

function summarizeAgentInstruction(instruction: string) {
  const trimmed = instruction.trim();
  if (!trimmed) return "Agent reviewed the profile and kept current positioning.";
  return `Profile adjusted from agent instruction: ${trimmed.slice(0, 160)}${trimmed.length > 160 ? "..." : ""}`;
}

function unique(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function normalizeProfile(profile: Partial<CareerProfile>) {
  return {
    ...defaultProfile,
    ...profile,
    targetLocations: profile.targetLocations || defaultProfile.targetLocations,
    targetRoles: profile.targetRoles || defaultProfile.targetRoles,
    coreSkills: profile.coreSkills || defaultProfile.coreSkills,
    constraints: profile.constraints || defaultProfile.constraints,
    resumeTemplates: profile.resumeTemplates || defaultProfile.resumeTemplates,
    memory: profile.memory || defaultProfile.memory,
    agentNotes: profile.agentNotes || defaultProfile.agentNotes,
  };
}

const localProfileRepository: ProfileRepository = {
  mode: "local",
  load() {
    if (!existsSync(PROFILE_PATH)) return defaultProfile;
    const raw = readFileSync(PROFILE_PATH, "utf8").trim();
    if (!raw) return defaultProfile;
    return normalizeProfile(JSON.parse(raw) as Partial<CareerProfile>);
  },
  save(profile) {
    assertWritableStorage();
    const nextProfile = {
      ...normalizeProfile(profile),
      updatedAt: new Date().toISOString(),
    };
    mkdirSync(dirname(PROFILE_PATH), { recursive: true });
    writeFileSync(PROFILE_PATH, JSON.stringify(nextProfile, null, 2), "utf8");
    return nextProfile;
  },
};

const asyncLocalProfileRepository: AsyncProfileRepository = {
  mode: "local",
  async load() {
    return localProfileRepository.load();
  },
  async save(profile) {
    return localProfileRepository.save(profile);
  },
};

type ProfileRow = {
  external_id: string | null;
  candidate_name: string;
  headline: string;
  current_location: string;
  work_authorization: string;
  salary_expectation: string;
  target_locations: string[];
  target_roles: string[];
  core_skills: string[];
  profile_description: string;
  reason_for_change: string;
  constraints: string[];
  confirmed_at: string | null;
  memory: string[];
  agent_notes: AgentNote[];
  created_at: string;
  updated_at: string;
};

type ResumeVariantRow = {
  name: string;
  focus: string;
  notes: string;
};

const pilotUserEmail = "samruddhi-pilot@vyoma.local";

const blockedSyncPostgresProfileRepository: ProfileRepository = {
  mode: "postgres",
  load() {
    throw new Error("Use loadProfileAsync() for Postgres profile storage.");
  },
  save() {
    throw new Error("Use saveProfileAsync() for Postgres profile storage.");
  },
};

const postgresProfileRepository: AsyncProfileRepository = {
  mode: "postgres",
  load() {
    return loadPostgresProfile();
  },
  save(profile) {
    return savePostgresProfile(profile);
  },
};

async function ensurePilotUser() {
  assertDatabaseConfigured("Profile repository");
  const sql = getDatabaseSql();
  const existing = (await sql.query(
    "select id from users where email = $1 limit 1",
    [pilotUserEmail],
  )) as Array<{ id: string }>;
  if (existing[0]?.id) return existing[0].id;

  const inserted = (await sql.query(
    "insert into users (email, name, auth_provider) values ($1, $2, $3) returning id",
    [pilotUserEmail, defaultProfile.candidateName, "local-pilot"],
  )) as Array<{ id: string }>;
  return inserted[0].id;
}

async function loadPostgresProfile(): Promise<CareerProfile> {
  const userId = await ensurePilotUser();
  const sql = getDatabaseSql();
  const rows = (await sql.query(
    "select external_id, candidate_name, headline, current_location, work_authorization, salary_expectation, target_locations, target_roles, core_skills, profile_description, reason_for_change, constraints, confirmed_at, memory, agent_notes, created_at, updated_at from profiles where user_id = $1 and external_id = $2 limit 1",
    [userId, defaultProfile.id],
  )) as ProfileRow[];

  if (!rows[0]) {
    return savePostgresProfile(defaultProfile);
  }

  const resumeRows = (await sql.query(
    "select name, focus, notes from resume_variants where profile_id = (select id from profiles where user_id = $1 and external_id = $2 limit 1) order by created_at asc",
    [userId, defaultProfile.id],
  )) as ResumeVariantRow[];

  return normalizeProfile({
    id: rows[0].external_id || defaultProfile.id,
    candidateName: rows[0].candidate_name,
    headline: rows[0].headline,
    currentLocation: rows[0].current_location,
    workAuthorization: rows[0].work_authorization,
    salaryExpectation: rows[0].salary_expectation,
    targetLocations: rows[0].target_locations,
    targetRoles: rows[0].target_roles,
    coreSkills: rows[0].core_skills,
    profileDescription: rows[0].profile_description,
    reasonForChange: rows[0].reason_for_change,
    constraints: rows[0].constraints,
    resumeTemplates: resumeRows.length ? resumeRows : defaultProfile.resumeTemplates,
    confirmed: Boolean(rows[0].confirmed_at),
    memory: rows[0].memory,
    agentNotes: rows[0].agent_notes,
    createdAt: rows[0].created_at,
    updatedAt: rows[0].updated_at,
  });
}

async function savePostgresProfile(profile: CareerProfile): Promise<CareerProfile> {
  const nextProfile = normalizeProfile({
    ...profile,
    updatedAt: new Date().toISOString(),
  });
  const userId = await ensurePilotUser();
  const sql = getDatabaseSql();
  const confirmedAt = nextProfile.confirmed ? new Date().toISOString() : null;
  const rows = (await sql.query(
    [
      "insert into profiles (user_id, external_id, candidate_name, headline, current_location, work_authorization, salary_expectation, target_locations, target_roles, core_skills, profile_description, reason_for_change, constraints, confirmed_at, memory, agent_notes)",
      "values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12, $13::jsonb, $14, $15::jsonb, $16::jsonb)",
      "on conflict (user_id, external_id) where external_id is not null do update set",
      "candidate_name = excluded.candidate_name, headline = excluded.headline, current_location = excluded.current_location, work_authorization = excluded.work_authorization, salary_expectation = excluded.salary_expectation, target_locations = excluded.target_locations, target_roles = excluded.target_roles, core_skills = excluded.core_skills, profile_description = excluded.profile_description, reason_for_change = excluded.reason_for_change, constraints = excluded.constraints, confirmed_at = excluded.confirmed_at, memory = excluded.memory, agent_notes = excluded.agent_notes",
      "returning id, created_at, updated_at",
    ].join(" "),
    [
      userId,
      nextProfile.id,
      nextProfile.candidateName,
      nextProfile.headline,
      nextProfile.currentLocation,
      nextProfile.workAuthorization,
      nextProfile.salaryExpectation,
      JSON.stringify(nextProfile.targetLocations),
      JSON.stringify(nextProfile.targetRoles),
      JSON.stringify(nextProfile.coreSkills),
      nextProfile.profileDescription,
      nextProfile.reasonForChange,
      JSON.stringify(nextProfile.constraints),
      confirmedAt,
      JSON.stringify(nextProfile.memory),
      JSON.stringify(nextProfile.agentNotes),
    ],
  )) as Array<{ id: string; created_at: string; updated_at: string }>;

  const profileId = rows[0].id;
  await sql.query("delete from resume_variants where profile_id = $1", [profileId]);
  for (const template of nextProfile.resumeTemplates) {
    await sql.query(
      "insert into resume_variants (profile_id, name, focus, notes) values ($1, $2, $3, $4)",
      [profileId, template.name, template.focus, template.notes],
    );
  }

  return {
    ...nextProfile,
    createdAt: rows[0].created_at,
    updatedAt: rows[0].updated_at,
  };
}
