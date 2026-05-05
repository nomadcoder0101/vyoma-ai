export type AuthProviderOption = {
  name: string;
  fit: "recommended" | "viable" | "later";
  summary: string;
  tradeoff: string;
};

export type AuthMilestone = {
  title: string;
  detail: string;
  status: "ready" | "next" | "later";
};

export const authProviderOptions: AuthProviderOption[] = [
  {
    name: "Clerk",
    fit: "recommended",
    summary: "Fastest path to production login, hosted user management, social login, and session UI.",
    tradeoff: "Adds a paid external auth service if usage grows.",
  },
  {
    name: "Auth.js",
    fit: "viable",
    summary: "Open-source Next.js-native auth with email and OAuth providers.",
    tradeoff: "More setup work for adapters, session strategy, and account management UI.",
  },
  {
    name: "Supabase Auth",
    fit: "viable",
    summary: "Good fit if the production database is also Supabase Postgres.",
    tradeoff: "Best when the whole backend leans into Supabase conventions.",
  },
  {
    name: "Custom credentials",
    fit: "later",
    summary: "Only useful if Vyoma needs fully custom enterprise auth later.",
    tradeoff: "Highest security responsibility and least attractive for the current product stage.",
  },
];

export const authMilestones: AuthMilestone[] = [
  {
    title: "Choose provider",
    detail: "Use Clerk for the fastest launch unless the database decision pushes strongly toward Supabase Auth.",
    status: "next",
  },
  {
    title: "Protect app routes",
    detail: "Require a signed-in user for dashboard, onboarding, tracker, leads, resume, assistant, memory, and settings.",
    status: "next",
  },
  {
    title: "Create user profile boundary",
    detail: "Map the signed-in account to one or more career profiles through user_id and profile_id.",
    status: "next",
  },
  {
    title: "Migrate local pilot data",
    detail: "Import Samruddhi's current profile, tracker, leads, memory, and daily actions under the first real user account.",
    status: "later",
  },
  {
    title: "Add OAuth integrations",
    detail: "Add official OAuth providers only after the account boundary and database ownership are stable.",
    status: "later",
  },
];

export const protectedRouteGroups = [
  "Dashboard",
  "Profile onboarding",
  "Tracker",
  "Daily plan",
  "Leads",
  "Resume Studio",
  "Assistant",
  "Memory",
  "Settings",
];
