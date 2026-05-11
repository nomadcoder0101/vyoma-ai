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

const flowSteps = [
  { icon: <UserRoundCheck size={18} />, title: "Profile", text: "Tell the app who you are and what kind of work fits." },
  { icon: <CalendarCheck2 size={18} />, title: "Plan", text: "Start each day with a short, realistic list." },
  { icon: <Target size={18} />, title: "Leads", text: "Put jobs and recruiters into one review queue." },
  { icon: <FileText size={18} />, title: "Resume", text: "Choose the right version before applying." },
  { icon: <ListChecks size={18} />, title: "Tracker", text: "Follow up without losing context." },
  { icon: <BrainCircuit size={18} />, title: "Assistant", text: "Ask for wording, next steps, and calmer decisions." },
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
              <Link className="button secondary" href="#how-it-works">
                See how it works <ArrowRight size={16} />
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
            <h2>Everything follows one gentle flow</h2>
            <p>
              No maze of modules. The workspace moves from profile to plan to
              action, then remembers what happened.
            </p>
          </div>
          <div className="landingFlowMap">
            {flowSteps.map((step, index) => (
              <article className="landingFlowStep" key={step.title}>
                <span className="flowStepNumber">{index + 1}</span>
                <span className="cardIcon">{step.icon}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
                {index < flowSteps.length - 1 ? <ArrowRight className="flowStepArrow" size={18} /> : null}
              </article>
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
