import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import {
  authMilestones,
  authProviderOptions,
  protectedRouteGroups,
} from "../../lib/auth-plan";
import { getCurrentUser } from "../../lib/auth";
import { Feature, Footer, SectionTitle, Topbar } from "../components";

const fitLabels = {
  recommended: "Recommended",
  viable: "Viable",
  later: "Later",
};

const statusIcons = {
  ready: CheckCircle2,
  next: Clock3,
  later: LockKeyhole,
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; error?: string }>;
}) {
  const params = (await searchParams) || {};
  const next = safeNextPath(params.next || "/dashboard");
  const user = await getCurrentUser();

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section loginShell">
          <div>
            <SectionTitle
              title="Account Login"
              text="Sign in to keep profile, tracker, leads, daily actions, and assistant memory scoped to one account."
            />
            <div className="loginCard">
              <span className="cardIcon">
                <UserRoundCheck size={20} />
              </span>
              <h3>{user ? "Signed in" : "Create or access account"}</h3>
              <p>
                {user
                  ? `You are signed in as ${user.email}. Continue to the protected dashboard.`
                  : "Use the account email for this career profile. This first-party session can later be replaced by Clerk or Auth.js without changing the data model."}
              </p>
              {params.error ? <p className="formError">Enter a valid email address.</p> : null}
              {user ? (
                <div className="loginActions">
                  <Link className="button primary" href={next}>
                    Continue <ArrowRight size={16} />
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button className="button secondary" type="submit">
                      Sign out
                    </button>
                  </form>
                </div>
              ) : (
                <form className="loginForm" action="/api/auth/login" method="post">
                  <input name="next" type="hidden" value={next} />
                  <label>
                    Name
                    <input
                      name="name"
                      defaultValue="Samruddhi Chougule"
                      autoComplete="name"
                    />
                  </label>
                  <label>
                    Email
                    <input
                      name="email"
                      type="email"
                      defaultValue="samruddhi@example.com"
                      autoComplete="email"
                      required
                    />
                  </label>
                  <button className="button primary" type="submit">
                    Sign in <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>

          <aside className="panel">
            <div className="panelHeader">
              <strong>Production auth choice</strong>
              <span className="statusPill">Next</span>
            </div>
            <span className="cardIcon">
              <LockKeyhole size={20} />
            </span>
              <h3>Recommended: Clerk</h3>
            <p>
              Use Clerk for the first public launch because it gives us secure
              login, session handling, hosted account UI, and route protection
              quickly on Vercel.
            </p>
            <Link className="button secondary cardButton" href="/settings">
              View readiness <ArrowRight size={16} />
            </Link>
          </aside>
        </section>

        <section className="section">
          <SectionTitle
            title="Auth Provider Options"
            text="The practical choices for turning this pilot into a real account-based product."
          />
          <div className="authOptionGrid">
            {authProviderOptions.map((option) => (
              <article className="authOption" key={option.name}>
                <div className="schemaTableTop">
                  <strong>{option.name}</strong>
                  <span className={`tag ${option.fit === "recommended" ? "teal" : "amber"}`}>
                    {fitLabels[option.fit]}
                  </span>
                </div>
                <p>{option.summary}</p>
                <span>{option.tradeoff}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="section loginShell">
          <div className="panel">
            <div className="panelHeader">
              <strong>Implementation milestones</strong>
              <span className="statusPill">Auth boundary</span>
            </div>
            <div className="settingsList">
              {authMilestones.map((milestone) => {
                const Icon = statusIcons[milestone.status];
                return (
                  <article className="settingsItem" key={milestone.title}>
                    <span className="cardIcon">
                      <Icon size={20} />
                    </span>
                    <div>
                      <div className="settingsItemTop">
                        <strong>{milestone.title}</strong>
                        <span className={`tag ${milestone.status === "next" ? "amber" : "teal"}`}>
                          {milestone.status}
                        </span>
                      </div>
                      <p>{milestone.detail}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="panel">
            <div className="panelHeader">
              <strong>Protected app areas</strong>
              <span className="statusPill">{protectedRouteGroups.length} routes</span>
            </div>
            <div className="protectedRouteList">
              {protectedRouteGroups.map((route) => (
                <span key={route}>
                  <ShieldCheck size={16} />
                  {route}
                </span>
              ))}
            </div>
          </aside>
        </section>

        <section className="section">
          <div className="grid3">
            <Feature
              icon={<KeyRound size={20} />}
              title="Account ownership"
              text="Every tracker row, lead, profile, memory item, and resume variant must belong to a signed-in account."
            />
            <Feature
              icon={<ShieldCheck size={20} />}
              title="Private career data"
              text="Resumes, visa notes, tracker history, and assistant memory are private user data."
            />
            <Feature
              icon={<LockKeyhole size={20} />}
              title="OAuth later"
              text="LinkedIn and other integrations should use official OAuth after login and database ownership are stable."
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function safeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value.startsWith("/api/")) return "/dashboard";
  return value;
}
