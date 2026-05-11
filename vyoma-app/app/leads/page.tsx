import { Inbox } from "lucide-react";
import { leadSummary, loadLeadsAsync } from "../../lib/leads";
import { Footer, MetricCard, SectionTitle, Topbar } from "../components";
import { LeadForm } from "./lead-form";
import { LeadImporter } from "./lead-importer";
import { LeadQueue } from "./lead-queue";

export default async function LeadsPage() {
  const leads = await loadLeadsAsync();
  const summary = leadSummary(leads);

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section">
          <SectionTitle
            title="Lead Workspace"
            text="One place for opportunities. Add a lead, review fit, draft outreach, and move only the good ones into the tracker."
          />
          <div className="metricGrid dashboardMetrics">
            <MetricCard value={summary.total} label="Total leads captured" />
            <MetricCard value={summary.newCount} label="New leads to review" />
            <MetricCard value={summary.jobs} label="Job links" />
            <MetricCard value={summary.recruiters} label="Recruiter/profile links" />
          </div>
        </section>

        <section className="section leadWorkspace">
          <div className="leadIntakeColumn">
            <div className="panel">
              <div className="panelHeader">
                <strong>Add one lead</strong>
                <span className="statusPill">Quick capture</span>
              </div>
              <LeadForm />
            </div>

            <div className="panel quietPanel">
              <div className="panelHeader">
                <strong>Paste a full job post</strong>
                <span className="statusPill">AI import</span>
              </div>
              <LeadImporter />
            </div>
          </div>

          <div className="panel leadQueuePanel">
            <div className="panelHeader">
              <strong>Review queue</strong>
              <span className="statusPill">Work left to right</span>
            </div>
            {leads.length === 0 ? (
              <div className="emptyState">
                <Inbox size={32} />
                <strong>No leads yet</strong>
                <span>Open the Daily Plan, search LinkedIn, and paste useful links here.</span>
              </div>
            ) : (
              <LeadQueue initialLeads={leads} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
