import { Inbox, MessageSquareText, Search } from "lucide-react";
import { followUpMessage } from "../../lib/content";
import { leadSummary, loadLeadsAsync } from "../../lib/leads";
import { Feature, Footer, MetricCard, SectionTitle, Topbar } from "../components";
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
            title="Lead Intake"
            text="Paste promising job, recruiter, or company links from LinkedIn searches. This turns daily search into a queue the AI can evaluate next."
          />
          <div className="metricGrid dashboardMetrics">
            <MetricCard value={summary.total} label="Total leads captured" />
            <MetricCard value={summary.newCount} label="New leads to review" />
            <MetricCard value={summary.jobs} label="Job links" />
            <MetricCard value={summary.recruiters} label="Recruiter/profile links" />
          </div>
        </section>

        <section className="section">
          <div className="dashboard">
            <div className="panel">
              <div className="panelHeader">
                <strong>Add a new lead</strong>
                <span className="statusPill">Local v1</span>
              </div>
              <LeadForm />
            </div>

            <div className="card">
              <span className="cardIcon">
                <MessageSquareText size={20} />
              </span>
              <h3>Default outreach draft</h3>
              <div className="messageBox">{followUpMessage}</div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel">
            <div className="panelHeader">
              <strong>Job Lead Import Assistant</strong>
              <span className="statusPill">One-step import</span>
            </div>
            <LeadImporter />
          </div>
        </section>

        <section className="section">
          <SectionTitle
            title="Lead Queue"
            text="Newest links first. Filter by status, evaluate fit, draft outreach, and move promising leads into the tracker."
          />
          <div className="panel">
            <div className="panelHeader">
              <strong>All captured leads</strong>
              <span className="statusPill">Archived hidden by default</span>
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

        <section className="section">
          <div className="grid3">
            <Feature
              icon={<Search size={20} />}
              title="Capture from search"
              text="Use Daily Plan links, then paste the best results into this intake queue."
            />
            <Feature
              icon={<MessageSquareText size={20} />}
              title="Prepare outreach"
              text="For recruiter/profile leads, draft a message before sending anything."
            />
            <Feature
              icon={<Inbox size={20} />}
              title="Review queue"
              text="Batch-review leads each day instead of losing links across tabs and chat."
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
