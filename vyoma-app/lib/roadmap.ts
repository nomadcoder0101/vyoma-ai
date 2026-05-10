export type RoadmapItem = {
  area: string;
  status: "done" | "in_progress" | "next" | "planned";
  title: string;
  detail: string;
};

export const roadmap: RoadmapItem[] = [
  {
    area: "Landing",
    status: "done",
    title: "Public product page",
    detail: "Explains Vyoma AI and routes users into login, onboarding, dashboard, daily plan, tracker, and leads.",
  },
  {
    area: "Account",
    status: "done",
    title: "Clerk authentication",
    detail: "Clerk handles sign-in, sign-up, session UI, route protection, and identity mapping into user-owned profile data.",
  },
  {
    area: "Profile",
    status: "done",
    title: "Career Ops profile setup",
    detail: "Captures profile summary, work preferences, role targets, markets, skills, memory, and resume/CV versions.",
  },
  {
    area: "Profile",
    status: "in_progress",
    title: "Agent-assisted profile edits",
    detail: "Profile agent can reshape the draft for stronger role positioning, location preferences, and clearer profile language.",
  },
  {
    area: "Dashboard",
    status: "done",
    title: "Personalized dashboard",
    detail: "Reads tracker, leads, profile confirmation, target markets, resume map, and memory notes.",
  },
  {
    area: "Daily Plan",
    status: "done",
    title: "Search rhythm",
    detail: "Provides a checkable daily workflow for follow-ups, lead review, resume choice, search, and outreach.",
  },
  {
    area: "Leads",
    status: "done",
    title: "Lead intake and actions",
    detail: "Captures leads, evaluates fit, drafts outreach, filters by status, copies drafts, archives, and converts leads to tracker rows.",
  },
  {
    area: "Tracker",
    status: "done",
    title: "Application tracker",
    detail: "Imports the existing tracker and shows follow-up queues, status buckets, and application history.",
  },
  {
    area: "Resume",
    status: "done",
    title: "Resume Studio",
    detail: "Maps resume versions to role families and recommends the best version for pasted job descriptions.",
  },
  {
    area: "Memory",
    status: "done",
    title: "Profile memory and suggestions",
    detail: "Stores memory notes, assistant conversations, shortcomings, and tracker outcome learning signals.",
  },
  {
    area: "Settings",
    status: "done",
    title: "Production readiness view",
    detail: "Shows environment status, AI mode, local storage files, deployment blockers, and integration readiness.",
  },
  {
    area: "Storage",
    status: "done",
    title: "Storage adapter boundary",
    detail: "Profile, tracker, leads, daily tasks, and assistant memory have local and Postgres repository implementations.",
  },
  {
    area: "AI",
    status: "done",
    title: "OpenAI assistant integration",
    detail: "OpenAI-backed assistant is connected for profile-aware guidance, with local fallback still available.",
  },
  {
    area: "Resume",
    status: "next",
    title: "Direct resume file upload",
    detail: "Resume names, links, and usage notes are saved now. Next step is blob storage for direct file uploads and parsing.",
  },
  {
    area: "Integrations",
    status: "in_progress",
    title: "Official OAuth integrations",
    detail: "Encrypted token storage exists. Provider OAuth flows need approved app credentials and scopes.",
  },
  {
    area: "Deployment",
    status: "done",
    title: "Vercel and vyomaai.in",
    detail: "Production is deployed to Vercel with vyomaai.in aliases, Neon Postgres, protected routes, and core environment variables.",
  },
];
