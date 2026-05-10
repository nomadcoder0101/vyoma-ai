import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CalendarCheck2,
  FileText,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { Feature, Footer, Topbar } from "./components";

const journey = [
  {
    title: "Create the career profile",
    text: "Capture the candidate story, resumes, work authorization, preferred locations, and role targets.",
  },
  {
    title: "Review the daily plan",
    text: "Start each day with follow-ups, lead review, search shortcuts, and outreach tasks.",
  },
  {
    title: "Evaluate leads before applying",
    text: "Paste job or recruiter links, score the fit, draft outreach, and convert strong leads into tracker rows.",
  },
  {
    title: "Let memory improve the search",
    text: "The assistant remembers profile decisions, tracker outcomes, and search patterns for better recommendations.",
  },
];

const appAreas = [
  {
    href: "/onboarding",
    icon: <UserRoundCheck size={20} />,
    title: "Profile Setup",
    text: "The source of truth for positioning, sponsorship, resume variants, and target markets.",
  },
  {
    href: "/daily-plan",
    icon: <CalendarCheck2 size={20} />,
    title: "Daily Plan",
    text: "A practical checklist for what to do today, not a vague list of ideas.",
  },
  {
    href: "/leads",
    icon: <Target size={20} />,
    title: "Lead Review",
    text: "Evaluate jobs, recruiters, and companies before spending time on them.",
  },
  {
    href: "/tracker",
    icon: <ListChecks size={20} />,
    title: "Application Tracker",
    text: "Know what has been applied, what needs follow-up, and what is going cold.",
  },
  {
    href: "/resume",
    icon: <FileText size={20} />,
    title: "Resume Studio",
    text: "Choose the right resume version for each AML, KYC, ECDD, or reporting role.",
  },
  {
    href: "/assistant",
    icon: <BrainCircuit size={20} />,
    title: "AI Assistant",
    text: "Ask profile-aware questions and draft next actions with the latest context.",
  },
];

export default function Home() {
  return (
    <div className="shell">
      <Topbar />

      <main>
        <section className="landingHero">
          <div className="landingHeroText">
            <p className="eyebrow">Vyoma AI career operations</p>
            <h1>One calm workspace for a serious job search.</h1>
            <p>
              Vyoma AI helps a candidate move from scattered applications to a
              daily operating rhythm: profile, tracker, leads, resume choice,
              outreach, and AI memory in one place.
            </p>
            <div className="heroActions">
              <Show when="signed-out">
                <SignUpButton mode="modal">Create account</SignUpButton>
                <SignInButton mode="modal">Sign in</SignInButton>
              </Show>
              <Show when="signed-in">
                <Link className="button primary" href="/dashboard">
                  Open dashboard <ArrowRight size={16} />
                </Link>
              </Show>
              <Link className="button secondary" href="#how-it-works">
                See how it works
              </Link>
            </div>
          </div>

          <div className="commandPreview" aria-label="Vyoma workflow preview">
            <div className="commandPreviewTop">
              <span>Today</span>
              <strong>Job search command center</strong>
            </div>
            <div className="commandPreviewRows">
              <span><BadgeCheck size={16} /> Confirm profile and resume map</span>
              <span><ListChecks size={16} /> Follow up on warm applications</span>
              <span><Target size={16} /> Evaluate new recruiter and job leads</span>
              <span><MessageSquareText size={16} /> Draft outreach before sending</span>
            </div>
          </div>
        </section>

        <section className="flowBand" id="how-it-works">
          <div className="flowIntro">
            <p className="eyebrow">How the app guides the user</p>
            <h2>Start with identity, then work the search every day.</h2>
          </div>
          <div className="journeyGrid">
            {journey.map((step, index) => (
              <article className="journeyStep" key={step.title}>
                <span>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="main landingMain">
          <div className="sectionTitle">
            <h2>What you can do inside</h2>
            <p>
              Each area has a job in the workflow, so a new user knows where
              to go and why it matters.
            </p>
          </div>
          <div className="appAreaGrid">
            {appAreas.map((area) => (
              <Link className="appArea" href={area.href} key={area.href}>
                <span className="cardIcon">{area.icon}</span>
                <div>
                  <h3>{area.title}</h3>
                  <p>{area.text}</p>
                </div>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
        </section>

        <section className="main">
          <div className="grid3">
            <Feature
              icon={<ShieldCheck size={20} />}
              title="Private by account"
              text="Clerk authentication and Postgres storage keep career data scoped to the signed-in user."
            />
            <Feature
              icon={<BrainCircuit size={20} />}
              title="AI with memory"
              text="The assistant uses profile, tracker, leads, and memory context rather than generic advice."
            />
            <Feature
              icon={<Target size={20} />}
              title="Built for hard searches"
              text="The pilot handles sponsorship, relocation, APAC remote options, and role-specific positioning."
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
