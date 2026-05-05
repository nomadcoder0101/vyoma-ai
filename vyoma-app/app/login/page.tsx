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

export default function LoginPage() {
  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section loginShell">
          <div>
            <SectionTitle
              title="Account Login"
              text="For the pilot, this screen represents the account boundary. Production will replace it with real authentication before public use."
            />
            <div className="loginCard">
              <span className="cardIcon">
                <UserRoundCheck size={20} />
              </span>
              <h3>Samruddhi pilot profile</h3>
              <p>
                Continue into the profile setup, confirm the Career Ops profile,
                then use the dashboard for daily job-search actions.
              </p>
              <Link className="button primary" href="/onboarding">
                Continue <ArrowRight size={16} />
              </Link>
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
