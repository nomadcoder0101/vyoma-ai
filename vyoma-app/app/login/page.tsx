import { ArrowRight, LockKeyhole, ShieldCheck, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { AuthControls } from "../auth-controls";
import { Feature, Footer, SectionTitle, Topbar } from "../components";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; error?: string }>;
}) {
  const params = (await searchParams) || {};
  const next = safeNextPath(params.next || "/dashboard");

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section loginShell">
          <div>
            <SectionTitle
              title="Welcome Back"
              text="Sign in to continue your job-search workspace, or create an account if this is your first visit."
            />
            <div className="loginCard">
              <span className="cardIcon">
                <UserRoundCheck size={20} />
              </span>
              <h3>Your private workspace</h3>
              <p>
                Your profile, resume versions, leads, tracker, daily plan, and
                assistant memory stay connected to your signed-in account.
              </p>
              {params.error ? <p className="formError">Sign-in could not be completed.</p> : null}
              <div className="loginActions">
                <AuthControls variant="login" signInRedirectUrl={next} signUpRedirectUrl="/onboarding" />
              </div>
            </div>
          </div>

          <aside className="panel">
            <div className="panelHeader">
              <strong>After login</strong>
              <span className="statusPill">Guided</span>
            </div>
            <span className="cardIcon">
              <LockKeyhole size={20} />
            </span>
            <h3>Start where it matters</h3>
            <p className="settingsAsideText">
              New users should confirm the profile first. Returning users can
              go straight to the dashboard and daily plan.
            </p>
            <Link className="button secondary cardButton" href="/dashboard">
              Open dashboard <ArrowRight size={16} />
            </Link>
          </aside>
        </section>

        <section className="section">
          <div className="grid3">
            <Feature
              icon={<ShieldCheck size={20} />}
              title="Account scoped"
              text="Career data is scoped to the signed-in user and stored in Postgres in production."
            />
            <Feature
              icon={<UserRoundCheck size={20} />}
              title="Profile first"
              text="Your profile powers lead scoring, resume choice, outreach, and assistant recommendations."
            />
            <Feature
              icon={<LockKeyhole size={20} />}
              title="No password storage here"
              text="Authentication is handled by Clerk; Vyoma does not store account passwords."
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
