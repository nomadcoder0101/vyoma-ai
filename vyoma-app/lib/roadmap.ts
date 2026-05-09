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
    title: "Login boundary",
    detail: "First-party signed sessions protect app routes and APIs, and signed-in emails map to user-owned profile data.",
  },
  {
    area: "Profile",
    status: "done",
    title: "Career Ops profile setup",
    detail: "Captures profile summary, relocation context, work authorization, role targets, markets, skills, memory, and resume variants.",
  },
  {
    area: "Profile",
    status: "in_progress",
    title: "Agent-assisted profile edits",
    detail: "Local profile agent can reshape the draft for Singapore, sponsorship, KYC, transaction monitoring, remote APAC, and stronger positioning.",
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
    detail: "Provides daily LinkedIn search paths for Malaysia, Singapore, recruiters, and remote APAC.",
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
    status: "in_progress",
    title: "OpenAI assistant integration",
    detail: "Replace local rules with a real assistant that can parse resumes, refine profile, evaluate roles, and draft messages.",
  },
  {
    area: "Account",
    status: "next",
    title: "Upgrade managed auth",
    detail: "Replace first-party sessions with Clerk or Auth.js for verified email ownership, social login, and account management.",
  },
  {
    area: "Integrations",
    status: "in_progress",
    title: "Official OAuth integrations",
    detail: "Repository boundary exists for official OAuth metadata. Next step is encrypted token storage and provider flow.",
  },
  {
    area: "Deployment",
    status: "done",
    title: "Vercel and app.vyomaai.in",
    detail: "Production is deployed to Vercel with vyomaai.in aliases, Neon Postgres, protected routes, and core environment variables.",
  },
];
