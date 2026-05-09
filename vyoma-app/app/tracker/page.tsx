import { loadApplicationsAsync, trackerSummary } from "../../lib/tracker";
import { Footer, MetricCard, SectionTitle, Topbar } from "../components";
import { TrackerTable } from "./tracker-table";

export default async function TrackerPage() {
  const apps = await loadApplicationsAsync();
  const summary = trackerSummary(apps);

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section">
          <SectionTitle
            title="Application Tracker"
            text="Application history plus app-side pipeline actions. Original imported tracker stays untouched; actions are stored separately."
          />
          <div className="metricGrid dashboardMetrics">
            <MetricCard value={summary.total} label="Applications" />
            <MetricCard value={summary.overdue} label="Overdue follow-ups" />
            <MetricCard value={summary.due} label="Due follow-ups" />
            <MetricCard value={summary.waiting} label="Still waiting" />
          </div>
        </section>

        <section className="section">
          <div className="panel">
            <div className="panelHeader">
              <strong>{summary.total} applications</strong>
              <span className="statusPill">Actionable v2</span>
            </div>
            <TrackerTable initialApps={apps} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
