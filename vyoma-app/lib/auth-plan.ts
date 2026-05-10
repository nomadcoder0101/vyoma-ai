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
    title: "Clerk session boundary",
    detail: "Clerk owns sign-in, session UI, and route protection for the app.",
    status: "ready",
  },
  {
    title: "Protect app routes",
    detail: "Dashboard, onboarding, tracker, leads, resume, assistant, memory, settings, and APIs require a signed-in user.",
    status: "ready",
  },
  {
    title: "Create user profile boundary",
    detail: "The signed-in account maps to user_id and profile_id for profile, tracker, leads, daily tasks, and memory.",
    status: "ready",
  },
  {
    title: "Migrate local pilot data",
    detail: "Import Samruddhi's current profile, tracker, leads, memory, and daily actions under the first real user account.",
    status: "later",
  },
  {
    title: "Add Clerk environment keys",
    detail: "Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY locally and in Vercel before production sign-in testing.",
    status: "next",
  },
  {
    title: "Add OAuth integrations",
    detail: "Add official LinkedIn OAuth only after encrypted token storage is implemented.",
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
