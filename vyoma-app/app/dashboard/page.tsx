import {
  BriefcaseBusiness,
  Bot,
  CalendarClock,
  FileText,
  MessageSquareText,
} from "lucide-react";
import { followUpMessage, recommendations } from "../../lib/content";
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
  const metrics = [
    { value: summary.total, label: "Applications imported from tracker" },
    { value: summary.overdue + summary.due, label: "Follow-ups due or overdue" },
    { value: summary.waiting, label: "Fresh applications still waiting" },
    { value: `${completeness}%`, label: "Profile completeness" },
  ];

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section">
          <SectionTitle
            title="Career Ops Dashboard"
            text={`${profile.candidateName}'s daily command center for ${profile.targetRoles.slice(0, 3).join(", ")} roles.`}
          />
          <div className="metricGrid dashboardMetrics">
            {metrics.map((metric) => (
              <MetricCard {...metric} key={metric.label} />
            ))}
          </div>
        </section>

        <section className="section">
          <div className="dashboard">
            <div className="panel">
              <div className="panelHeader">
                <strong>Priority follow-up queue</strong>
                <span className="statusPill">Top 8</span>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Timing</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.followUps.map((item) => (
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
                        <span
                          className={`tag ${
                            item.urgency === "overdue" ? "red" : "amber"
                          }`}
                        >
                          {item.urgency === "overdue" ? "Overdue" : "Due"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="panel">
              <div className="panelHeader">
                <strong>Profile status</strong>
                <span className="statusPill">{profile.confirmed ? "Confirmed" : "Needs confirmation"}</span>
              </div>
              <div className="profileSnapshot">
                <h3>{profile.headline}</h3>
                <p>{profile.workAuthorization}</p>
                <div className="chipList">
                  {profile.targetLocations.slice(0, 5).map((location) => (
                    <span className="tag teal" key={location}>
                      {location}
                    </span>
                  ))}
                </div>
                <a className="button secondary" href="/onboarding">
                  Review profile
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="grid2">
            <div className="card">
              <span className="cardIcon">
                <BriefcaseBusiness size={20} />
              </span>
              <h3>Recommended next move</h3>
              <ul>
                {recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a className="button primary cardButton" href="/daily-plan">
                Open today&apos;s command center
              </a>
            </div>
            <div className="card">
              <span className="cardIcon">
                <Bot size={20} />
              </span>
              <h3>Ask Vyoma AI</h3>
              <p>
                Use the assistant for daily priorities, sponsorship wording,
                Singapore positioning, and resume selection.
              </p>
              <a className="button primary cardButton" href="/assistant">
                Open assistant
              </a>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="card">
            <span className="cardIcon">
              <MessageSquareText size={20} />
            </span>
            <h3>Follow-up message draft</h3>
            <div className="messageBox">{followUpMessage}</div>
          </div>
        </section>

        <section className="section">
          <div className="panel">
            <div className="panelHeader">
              <strong>Profile memory and improvement suggestions</strong>
              <span className="statusPill">{improvementSuggestions.length} active</span>
            </div>
            <div className="memoryGrid">
              <div>
                <h3>What the agent remembers</h3>
                <ul className="compactList">
                  {profile.memory.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>What to improve</h3>
                <ul className="compactList">
                  {improvementSuggestions.length ? (
                    improvementSuggestions.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>Profile is ready for the current pilot workflow.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="grid3">
            <Feature
              icon={<CalendarClock size={20} />}
              title="Daily rhythm"
              text={`${leads.newCount} new leads need review before adding more blind applications.`}
            />
            <Feature
              icon={<FileText size={20} />}
              title="Resume strategy"
              text={`${profile.resumeTemplates.length} resume templates are mapped to role families.`}
            />
            <Feature
              icon={<MessageSquareText size={20} />}
              title="Agent memory"
              text={profile.memory[0] || "The agent will learn from applications, leads, and outcomes."}
            />
          </div>
          <a className="button secondary sectionAction" href="/memory">
            Review memory
          </a>
          <a className="button secondary sectionAction" href="/resume">
            Open resume studio
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
