import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  FileText,
  LockKeyhole,
  MapPinned,
  MessageSquareText,
  Search,
  ShieldCheck,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { Feature, Footer, Topbar } from "./components";

export default function Home() {
  return (
    <div className="shell">
      <Topbar />

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">Vyoma AI pilot</p>
          <h1>AI-powered career operations for complex job searches.</h1>
          <p>
            Vyoma AI helps skilled professionals manage job searches across
            relocation, sponsorship, remote markets, and high-volume
            applications. The first pilot is built around Samruddhi&apos;s
            AML/FCC search in Malaysia, Singapore, and remote APAC.
          </p>
          <div className="heroActions">
            <Link className="button primary" href="/dashboard">
              Open Dashboard <ArrowRight size={16} />
            </Link>
            <Link className="button secondary" href="/login">
              Create Account <UserRoundCheck size={16} />
            </Link>
            <Link className="button secondary" href="/daily-plan">
              Today&apos;s Plan <Search size={16} />
            </Link>
          </div>
        </div>

        <aside className="heroPanel" aria-label="Product preview">
          <div className="panelHeader">
            <strong>Product workflow</strong>
            <span className="statusPill">Pilot active</span>
          </div>
          <div className="grid2">
            <Feature
              icon={<UserRoundCheck size={20} />}
              title="Profile"
              text="AML/FCC strengths, sponsorship needs, and target markets."
            />
            <Feature
              icon={<CalendarClock size={20} />}
              title="Cadence"
              text="Daily follow-up, recruiter search, and application rhythm."
            />
          </div>
        </aside>
      </section>

      <main className="main">
        <section className="section">
          <div className="sectionTitle">
            <h2>A strong profile is not always enough.</h2>
            <p>
              Skilled candidates can be filtered out because of sponsorship,
              relocation, unclear positioning, generic applications, or weak
              follow-up.
            </p>
          </div>
          <div className="grid3">
            <Feature
              icon={<LockKeyhole size={20} />}
              title="Sponsorship friction"
              text="Employment Pass requirements need honest handling without making them the whole story."
            />
            <Feature
              icon={<Target size={20} />}
              title="Sharper targeting"
              text="Focus on sponsor-capable employers, Singapore roles, and remote APAC opportunities."
            />
            <Feature
              icon={<MessageSquareText size={20} />}
              title="Better outreach"
              text="Turn applications into recruiter conversations, referrals, and disciplined follow-up."
            />
          </div>
        </section>

        <section className="section">
          <div className="sectionTitle">
            <h2>Built as an operating system.</h2>
            <p>
              The app turns resume context, tracker history, job links, and
              market constraints into daily next actions.
            </p>
          </div>
          <div className="grid3">
            <Feature
              icon={<FileText size={20} />}
              title="Tracker"
              text="One view of applications, dates, role types, and status."
            />
            <Feature
              icon={<MapPinned size={20} />}
              title="Market plan"
              text="Separate Malaysia, Singapore, and remote APAC workflows."
            />
            <Feature
              icon={<ShieldCheck size={20} />}
              title="Human control"
              text="Vyoma AI drafts and recommends. The candidate decides what gets sent."
            />
          </div>
        </section>

        <section className="section">
          <div className="grid3">
            <Feature
              icon={<BadgeCheck size={20} />}
              title="Pilot case"
              text="10+ years AML/KYC/FCC experience, 83 applications imported, and a focused sponsorship-aware strategy."
            />
            <Feature
              icon={<CalendarClock size={20} />}
              title="Daily app"
              text="Open the dashboard each day, run searches, follow up, and capture recruiter links."
            />
            <Feature
              icon={<ArrowRight size={20} />}
              title="Next phase"
              text="Add production auth, AI assistant API, Vercel deployment, and app.vyomaai.in."
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
