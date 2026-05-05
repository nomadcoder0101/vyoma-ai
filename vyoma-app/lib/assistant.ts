import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { assertDatabaseReady } from "./database";
import { leadSummary, loadLeads } from "./leads";
import { loadProfile, profileImprovementSuggestions, profileSummary } from "./profile";
import { assertWritableStorage, getStorageMode, type StorageMode } from "./storage-adapter";
import { loadApplications, trackerSummary } from "./tracker";

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantResult = {
  mode: "openai" | "local";
  content: string;
  memory?: AssistantMemory;
};

export type AssistantMemoryItem = {
  id: string;
  type: "conversation" | "decision" | "risk" | "next_action";
  text: string;
  createdAt: string;
};

export type AssistantMemory = {
  messages: AssistantMessage[];
  learnings: AssistantMemoryItem[];
  updatedAt: string;
};

const ASSISTANT_MEMORY_PATH = join(process.cwd(), "..", "data", "assistant-memory.json");

export type AssistantMemoryRepository = {
  mode: StorageMode;
  load: () => AssistantMemory;
  save: (memory: AssistantMemory) => AssistantMemory;
};

const greeting: AssistantMessage = {
  role: "assistant",
  content:
    "I am ready. Ask me for today's job-search plan, sponsorship wording, Singapore positioning, resume selection, or outreach strategy.",
};

export function loadAssistantMemory(): AssistantMemory {
  return getAssistantMemoryRepository().load();
}

export function saveAssistantMemory(memory: AssistantMemory) {
  return getAssistantMemoryRepository().save(memory);
}

export function getAssistantMemoryRepository(): AssistantMemoryRepository {
  const mode = getStorageMode();
  if (mode === "postgres") return postgresAssistantMemoryRepository;
  return localAssistantMemoryRepository;
}

export function rememberAssistantExchange(
  userMessage: string,
  assistantMessage: string,
  mode: "openai" | "local",
) {
  const memory = loadAssistantMemory();
  const now = new Date().toISOString();
  const learning = extractLearning(userMessage, assistantMessage, now);
  const nextMemory = saveAssistantMemory({
    messages: [
      ...memory.messages,
      { role: "user", content: userMessage },
      { role: "assistant", content: assistantMessage },
    ],
    learnings: learning ? [learning, ...memory.learnings] : memory.learnings,
    updatedAt: now,
  });

  return {
    ...nextMemory,
    learnings: [
      {
        id: `mode-${Date.now()}`,
        type: "conversation" as const,
        text: `Last assistant response used ${mode === "openai" ? "OpenAI" : "local fallback"} mode.`,
        createdAt: now,
      },
      ...nextMemory.learnings,
    ].slice(0, 30),
  };
}

export function buildAssistantContext() {
  const profile = loadProfile();
  const applications = loadApplications();
  const tracker = trackerSummary(applications);
  const leads = leadSummary(loadLeads());
  const suggestions = profileImprovementSuggestions(profile);

  return [
    `Candidate: ${profileSummary(profile)}`,
    `Profile confirmed: ${profile.confirmed ? "yes" : "no"}`,
    `Salary expectation: ${profile.salaryExpectation}`,
    `Profile description: ${profile.profileDescription}`,
    `Reason for change: ${profile.reasonForChange}`,
    `Constraints: ${profile.constraints.join(" | ")}`,
    `Core skills: ${profile.coreSkills.join(", ")}`,
    `Resume templates: ${profile.resumeTemplates
      .map((template) => `${template.name} (${template.focus})`)
      .join("; ")}`,
    `Memory: ${profile.memory.join(" | ")}`,
    `Application tracker: ${tracker.total} applications, ${tracker.overdue} overdue follow-ups, ${tracker.due} due follow-ups, ${tracker.waiting} waiting.`,
    `Lead queue: ${leads.total} total, ${leads.newCount} new, ${leads.jobs} jobs, ${leads.recruiters} recruiters.`,
    `Current improvement suggestions: ${suggestions.length ? suggestions.join(" | ") : "none"}`,
  ].join("\n");
}

export async function answerWithAssistant(
  message: string,
  history: AssistantMessage[] = [],
): Promise<AssistantResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      mode: "local",
      content: localAssistantReply(message),
    };
  }

  const context = buildAssistantContext();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      instructions: [
        "You are Vyoma AI, a career operations assistant for Samruddhi's AML/KYC and Financial Crime Compliance job search.",
        "Give practical, specific, profile-aware guidance. Keep the user in control.",
        "Do not claim you searched LinkedIn or sent messages unless the app explicitly did that.",
        "Do not ask for or store LinkedIn passwords. Prefer official OAuth or user-pasted links.",
        "Use the supplied profile, tracker, leads, and memory context as the source of truth.",
      ].join("\n"),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Context:\n${context}\n\nConversation:\n${formatHistory(history)}\n\nUser request:\n${message}`,
            },
          ],
        },
      ],
      max_output_tokens: 700,
    }),
  });

  if (!response.ok) {
    return {
      mode: "local",
      content: `${localAssistantReply(message)}\n\nNote: OpenAI request failed, so this answer used local fallback logic.`,
    };
  }

  const body = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  return {
    mode: "openai",
    content:
      body.output_text ||
      body.output?.flatMap((item) => item.content || []).map((item) => item.text).filter(Boolean).join("\n") ||
      localAssistantReply(message),
  };
}

function formatHistory(history: AssistantMessage[]) {
  return history
    .slice(-8)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");
}

function localAssistantReply(message: string) {
  const text = message.toLowerCase();
  const profile = loadProfile();
  const tracker = trackerSummary(loadApplications());
  const leads = leadSummary(loadLeads());

  if (text.includes("today") || text.includes("daily") || text.includes("next")) {
    return [
      "Here is the best next operating rhythm for today:",
      "",
      `1. Clear follow-ups first: ${tracker.overdue} overdue and ${tracker.due} due.`,
      `2. Review lead queue: ${leads.newCount} new leads need evaluation.`,
      "3. Add only high-fit AML/KYC/FCC roles to the tracker.",
      "4. For each strong application, create one recruiter or referral touchpoint.",
      "5. Keep sponsorship wording clear, but lead with Samruddhi's AML/FCC value.",
    ].join("\n");
  }

  if (text.includes("sponsor") || text.includes("visa") || text.includes("employment pass")) {
    return [
      "For sponsorship, use a two-step framing:",
      "",
      "First establish fit: 10+ years AML/KYC/FCC, transaction monitoring, SAR/STR, CDD/EDD/ECDD, global banks and consulting.",
      "Then state authorization simply: based in Kuala Lumpur and eligible for employer-sponsored Employment Pass conversion.",
      "",
      "Avoid making sponsorship the opening sentence unless the employer directly asks for work authorization.",
    ].join("\n");
  }

  if (text.includes("singapore")) {
    return [
      "For Singapore, position her as a regional AML/FCC candidate rather than only a Malaysia-based applicant.",
      "",
      "Best targets: KYC/CDD/EDD, transaction monitoring, AML investigations, financial crime QA/checker, and regional compliance operations.",
      "Message angle: global-bank exposure, strong documentation, suspicious reporting, and readiness for APAC compliance environments.",
    ].join("\n");
  }

  if (text.includes("resume") || text.includes("cv")) {
    return [
      "Use resume variants by role family:",
      "",
      "KYC/CDD/EDD roles: use the KYC Operations version.",
      "Transaction monitoring or investigations: use the ECDD & TM version.",
      "SAR/STR/regulatory reporting: use the Financial Crime Reporting version.",
      "Broad AML/FCC roles: use the Financial Crime Compliance version.",
    ].join("\n");
  }

  return [
    `I am using ${profile.candidateName}'s confirmed profile, tracker, lead queue, and memory.`,
    "",
    "The highest-value move is to keep the search disciplined: follow up on existing applications, evaluate new leads before applying, and attach recruiter outreach to every strong role.",
    "",
    "Ask me for a daily plan, sponsorship wording, Singapore positioning, resume selection, or outreach draft.",
  ].join("\n");
}

function extractLearning(userMessage: string, assistantMessage: string, createdAt: string) {
  const text = userMessage.toLowerCase();
  if (text.includes("today") || text.includes("daily") || text.includes("next")) {
    return {
      id: `learning-${Date.now()}`,
      type: "next_action" as const,
      text: "User asked for daily priorities; keep follow-ups, lead evaluation, and recruiter outreach visible.",
      createdAt,
    };
  }
  if (text.includes("sponsor") || text.includes("visa") || text.includes("employment pass")) {
    return {
      id: `learning-${Date.now()}`,
      type: "risk" as const,
      text: "Sponsorship wording remains a recurring concern; lead with AML/FCC value before Employment Pass details.",
      createdAt,
    };
  }
  if (text.includes("singapore")) {
    return {
      id: `learning-${Date.now()}`,
      type: "decision" as const,
      text: "Singapore should be treated as a distinct search track, not just a backup to Malaysia.",
      createdAt,
    };
  }
  if (text.includes("resume") || text.includes("cv")) {
    return {
      id: `learning-${Date.now()}`,
      type: "decision" as const,
      text: "Resume selection should be role-family based: KYC, transaction monitoring, reporting, or broad FCC.",
      createdAt,
    };
  }
  if (assistantMessage) {
    return {
      id: `learning-${Date.now()}`,
      type: "conversation" as const,
      text: `Recent assistant topic: ${userMessage.slice(0, 140)}${userMessage.length > 140 ? "..." : ""}`,
      createdAt,
    };
  }
  return null;
}

function defaultLearnings(): AssistantMemoryItem[] {
  return [
    {
      id: "memory-followups",
      type: "next_action",
      text: "Start with overdue follow-ups before adding more applications.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "memory-sponsorship",
      type: "risk",
      text: "Employment Pass sponsorship is the main Malaysia friction and must be handled clearly.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "memory-role-split",
      type: "decision",
      text: "Keep separate tracks for KYC/ECDD, transaction monitoring, SAR/STR reporting, and broad FCC roles.",
      createdAt: new Date().toISOString(),
    },
  ];
}

function normalizeAssistantMemory(memory: Partial<AssistantMemory>): AssistantMemory {
  return {
    messages: memory.messages?.length ? memory.messages : [greeting],
    learnings: memory.learnings?.length ? memory.learnings : defaultLearnings(),
    updatedAt: memory.updatedAt || new Date().toISOString(),
  };
}

function trimAssistantMemory(memory: AssistantMemory): AssistantMemory {
  return {
    ...normalizeAssistantMemory(memory),
    messages: memory.messages.slice(-40),
    learnings: memory.learnings.slice(0, 40),
    updatedAt: new Date().toISOString(),
  };
}

const localAssistantMemoryRepository: AssistantMemoryRepository = {
  mode: "local",
  load() {
    if (!existsSync(ASSISTANT_MEMORY_PATH)) {
      return normalizeAssistantMemory({});
    }
    const raw = readFileSync(ASSISTANT_MEMORY_PATH, "utf8").trim();
    if (!raw) {
      return normalizeAssistantMemory({});
    }
    return normalizeAssistantMemory(JSON.parse(raw) as Partial<AssistantMemory>);
  },
  save(memory) {
    assertWritableStorage();
    const nextMemory = trimAssistantMemory(memory);
    mkdirSync(dirname(ASSISTANT_MEMORY_PATH), { recursive: true });
    writeFileSync(ASSISTANT_MEMORY_PATH, JSON.stringify(nextMemory, null, 2), "utf8");
    return nextMemory;
  },
};

const postgresAssistantMemoryRepository: AssistantMemoryRepository = {
  mode: "postgres",
  load() {
    assertDatabaseReady("Assistant memory repository");
  },
  save() {
    assertDatabaseReady("Assistant memory repository");
  },
};
