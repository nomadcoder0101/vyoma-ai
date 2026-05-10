import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarClock,
  FileText,
  ListChecks,
  MessageSquareText,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { recommendations } from "../../lib/content";
import { leadSummary, loadLeadsAsync } from "../../lib/leads";
import {
  loadProfileAsync,
  profileCompleteness,
  profileImprovementSuggestions,
} from "../../lib/profile";
import { loadApplicationsAsync, trackerSummary } from "../../lib/tracker";
import {
  Feature,
  Footer,
  MetricCard,
  SectionTitle,
  Topbar,
  formatDate,
} from "../components";

export default async function DashboardPage() {
  const apps = await loadApplicationsAsync();
  const summary = trackerSummary(apps);
  const leads = leadSummary(await loadLeadsAsync());
  const profile = await loadProfileAsync();
  const completeness = profileCompleteness(profile);
  const improvementSuggestions = profileImprovementSuggestions(profile);
  const setupDone = profile.confirmed && completeness >= 80;
  const followUpCount = summary.overdue + summary.due;

  const metrics = [
    { value: summary.total, label: "Applications tracked" },
    { value: followUpCount, label: "Follow-ups due" },
    { value: leads.newCount, label: "New leads to review" },
    { value: `${completeness}%`, label: "Profile ready" },
  ];

  const startActions = [
    {
      href: "/onboarding",
      icon: <UserRoundCheck size={18} />,
      title: setupDone ? "Profile is ready" : "Finish profile setup",
      text: setupDone
        ? "Review only when positioning or work authorization changes."
        : "Confirm profile, target markets, resume variants, and sponsorship wording.",
      status: setupDone ? "Ready" : "Start here",
    },
    {
      href: "/daily-plan",
      icon: <CalendarClock size={18} />,
      title: "Open today's plan",
      text: "Work the daily checklist: follow-ups, lead review, search, and outreach.",
      status: "Daily",
    },
    {
      href: "/leads",
      icon: <Target size={18} />,
      title: "Evaluate leads",
      text: "Score job and recruiter links before converting them into tracker rows.",
      status: `${leads.newCount} new`,
    },
    {
      href: "/assistant",
      icon: <Bot size={18} />,
      title: "Ask Vyoma AI",
      text: "Get profile-aware recommendations, outreach drafts, and search strategy.",
      status: "AI",
    },
  ];

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="dashboardHero">
          <div>
            <p className="eyebrow">Command center</p>
            <h1>{profile.candidateName}</h1>
            <p>
              A daily workspace for {profile.targetRoles.slice(0, 3).join(", ")}
              {" "}roles across {profile.targetLocations.slice(0, 3).join(", ")}.
            </p>
          </div>
          <div className="dashboardHeroActions">
            <Link className="button primary" href="/daily-plan">
              Start today <ArrowRight size={16} />
            </Link>
            <Link className="button secondary" href="/onboarding">
              Review profile
            </Link>
          </div>
        </section>

        <section className="section">
          <div className="metricGrid dashboardMetrics">
            {metrics.map((metric) => (
              <MetricCard {...metric} key={metric.label} />
            ))}
          </div>
        </section>

        <section className="section dashboardStart">
          <div>
            <SectionTitle
              title="What should I do next?"
              text="The dashboard now routes the user through the workflow instead of leaving them to guess."
            />
            <div className="nextActionGrid">
              {startActions.map((action) => (
                <Link className="nextAction" href={action.href} key={action.href}>
                  <span className="cardIcon">{action.icon}</span>
                  <div>
                    <span className="tag teal">{action.status}</span>
                    <h3>{action.title}</h3>
                    <p>{action.text}</p>
                  </div>
                  <ArrowRight size={18} />
                </Link>
              ))}
            </div>
          </div>

          <aside className="panel profilePulse">
            <div className="panelHeader">
              <strong>Profile pulse</strong>
              <span className="statusPill">{profile.confirmed ? "Confirmed" : "Needs review"}</span>
            </div>
            <h3>{profile.headline}</h3>
            <p>{profile.workAuthorization}</p>
            <div className="chipList">
              {profile.targetLocations.slice(0, 5).map((location) => (
                <span className="tag teal" key={location}>
                  {location}
                </span>
              ))}
            </div>
          </aside>
        </section>

        <section className="section dashboard">
          <div className="panel">
            <div className="panelHeader">
              <strong>Follow-up queue</strong>
              <span className="statusPill">{followUpCount} due</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Timing</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.followUps.length ? (
                  summary.followUps.slice(0, 6).map((item) => (
                    <tr key={`${item.num}-${item.company}-${item.role}`}>
                      <td>{item.company}</td>
                      <td>{item.role}</td>
                      <td>
                        Applied {formatDate(item.date)}
                        {item.daysSinceApplication !== null
                          ? ` (${item.daysSinceApplication}d)`
                          : ""}
                      </td>
                      <td>
                        <span className={`tag ${item.urgency === "overdue" ? "red" : "amber"}`}>
                          {item.urgency === "overdue" ? "Overdue" : "Due"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>No follow-ups are due right now.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <Link className="button secondary cardButton" href="/tracker">
              Open tracker
            </Link>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <strong>Search guidance</strong>
              <span className="statusPill">Recommended</span>
            </div>
            <ul className="compactList">
              {recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="button primary cardButton" href="/assistant">
              Ask for today&apos;s strategy
            </Link>
          </div>
        </section>

        <section className="section">
          <div className="memoryGrid">
            <div className="panel">
              <div className="panelHeader">
                <strong>Agent memory</strong>
                <span className="statusPill">{profile.memory.length} notes</span>
              </div>
              <ul className="compactList">
                {profile.memory.slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link className="button secondary cardButton" href="/memory">
                Review memory
              </Link>
            </div>
            <div className="panel">
              <div className="panelHeader">
                <strong>Improve next</strong>
                <span className="statusPill">{improvementSuggestions.length} items</span>
              </div>
              <ul className="compactList">
                {improvementSuggestions.length ? (
                  improvementSuggestions.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>Profile is ready for the current workflow.</li>
                )}
              </ul>
              <Link className="button secondary cardButton" href="/onboarding">
                Tune profile
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="grid3">
            <Feature
              icon={<CalendarClock size={20} />}
              title="Daily rhythm"
              text="Start with follow-ups, then evaluate leads, then apply or reach out."
            />
            <Feature
              icon={<FileText size={20} />}
              title="Resume strategy"
              text={`${profile.resumeTemplates.length} resume templates are mapped to role families.`}
            />
            <Feature
              icon={<MessageSquareText size={20} />}
              title="Outreach support"
              text="Draft messages only after the role, recruiter, or company has been evaluated."
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
