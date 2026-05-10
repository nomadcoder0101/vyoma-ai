import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck2,
  FileText,
  ListChecks,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { AuthControls } from "./auth-controls";
import { Feature, Footer, Topbar } from "./components";

const journey = [
  {
    title: "Set up your search",
    text: "Add your profile, preferred roles, locations, resume versions, and the reason you are looking.",
  },
  {
    title: "Know what matters today",
    text: "See a focused daily plan instead of waking up to a blank, stressful job board.",
  },
  {
    title: "Choose better opportunities",
    text: "Save jobs, recruiters, or companies as leads and review them before spending energy.",
  },
  {
    title: "Keep learning from progress",
    text: "Use tracker history and assistant memory to improve follow-ups, resumes, and outreach.",
  },
];

const appAreas = [
  {
    href: "/onboarding",
    icon: <UserRoundCheck size={20} />,
    title: "Profile",
    text: "Your story, target roles, locations, resume versions, constraints, and preferences.",
  },
  {
    href: "/daily-plan",
    icon: <CalendarCheck2 size={20} />,
    title: "Daily Plan",
    text: "A short list of today's actions so the search feels manageable.",
  },
  {
    href: "/leads",
    icon: <Target size={20} />,
    title: "Leads",
    text: "Capture job links, recruiters, companies, referrals, or ideas before deciding what to do.",
  },
  {
    href: "/tracker",
    icon: <ListChecks size={20} />,
    title: "Tracker",
    text: "Applications, follow-ups, outcomes, and status changes in one place.",
  },
  {
    href: "/resume",
    icon: <FileText size={20} />,
    title: "Resume Studio",
    text: "Pick the strongest resume version and positioning for each opportunity.",
  },
  {
    href: "/assistant",
    icon: <BrainCircuit size={20} />,
    title: "Assistant",
    text: "Ask for next steps, role fit, outreach drafts, and profile-aware guidance.",
  },
];

export default function Home() {
  return (
    <div className="shell">
      <Topbar />

      <main>
        <section className="landingHero calmHero">
          <div className="landingHeroText">
            <p className="eyebrow">Vyoma AI job search workspace</p>
            <h1>A calmer way to run your job search.</h1>
            <p>
              Job hunting can become noisy very quickly. Vyoma AI gives you one
              private workspace to organize your profile, applications, leads,
              resumes, follow-ups, and AI guidance.
            </p>
            <div className="heroActions">
              <AuthControls variant="hero" />
              <Link className="button secondary" href="#how-it-works">
                See the flow
              </Link>
            </div>
          </div>

          <div className="comfortPanel" aria-label="Job search workflow preview">
            <div className="comfortPanelTop">
              <span><Sparkles size={16} /> Today feels clearer</span>
              <strong>Small steps, visible progress</strong>
            </div>
            <div className="comfortList">
              <span><Search size={16} /> Review only the most useful opportunities</span>
              <span><MessageSquareText size={16} /> Draft outreach without starting from scratch</span>
              <span><ListChecks size={16} /> Follow up before good applications go cold</span>
              <span><ShieldCheck size={16} /> Keep personal career data private to your account</span>
            </div>
          </div>
        </section>

        <section className="flowBand softFlow" id="how-it-works">
          <div className="flowIntro">
            <p className="eyebrow">A simple path</p>
            <h2>From overwhelmed to organized.</h2>
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
            <h2>Everything has a clear place</h2>
            <p>
              The app is designed around the real rhythm of a job search:
              prepare, search, evaluate, apply, follow up, and learn.
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
              title="Private workspace"
              text="Authentication and database storage keep each user's career data scoped to their own account."
            />
            <Feature
              icon={<BrainCircuit size={20} />}
              title="Context-aware help"
              text="The assistant can use profile, tracker, leads, resume, and memory context when making suggestions."
            />
            <Feature
              icon={<Target size={20} />}
              title="Built for real-life searches"
              text="Use it for any role, industry, location preference, career change, relocation, or remote search."
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
