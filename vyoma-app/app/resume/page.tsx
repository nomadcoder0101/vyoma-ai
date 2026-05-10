import Link from "next/link";
import { ArrowRight, Download, FileCheck2, FileText, Link2, Sparkles, Upload } from "lucide-react";
import { loadProfileAsync } from "../../lib/profile";
import { Footer, MetricCard, SectionTitle, Topbar } from "../components";
import { ResumeAnalyzer } from "./resume-analyzer";

export default async function ResumeStudioPage() {
  const profile = await loadProfileAsync();

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section">
          <SectionTitle
            title="Resume Studio"
            text="Choose the right resume version for each role and generate profile-aware positioning notes."
          />
          <div className="metricGrid dashboardMetrics">
            <MetricCard value={profile.resumeTemplates.length} label="Resume versions mapped" />
            <MetricCard value={profile.targetRoles.length} label="Target role families" />
            <MetricCard value="Profile" label="Source of truth" />
            <MetricCard value="Rules" label="Recommendation mode" />
          </div>
        </section>

        <section className="section resumeStudioLayout">
          <div className="panel">
            <div className="panelHeader">
              <strong>Mapped resume versions</strong>
              <span className="statusPill">From profile</span>
            </div>
            <div className="resumeTemplateGrid">
              {profile.resumeTemplates.map((template, index) => (
                <article className="resumeTemplateCard" key={template.name}>
                  <span className="cardIcon">
                    <FileText size={20} />
                  </span>
                  <h3>{template.name}</h3>
                  <strong>{template.focus}</strong>
                  <p>{template.notes}</p>
                  {template.userComment ? <p>{template.userComment}</p> : null}
                  {template.parsedSummary ? (
                    <div className="resumeParseSummary">
                      <span className={`tag ${template.parsedSummary.status === "parsed" ? "teal" : "amber"}`}>
                        {template.parsedSummary.status || "pending"}
                      </span>
                      <span>{template.parsedSummary.wordCount || 0} words</span>
                      {template.parsedSummary.roleSignals?.slice(0, 2).map((signal) => (
                        <span key={signal}>{signal}</span>
                      ))}
                    </div>
                  ) : null}
                  {template.fileUrl ? (
                    <a className="inlineLink cardButton" href={`/api/resume/download?index=${index}`}>
                      Download attached file <Download size={14} />
                    </a>
                  ) : null}
                  {template.fileUrl ? (
                    <a className="inlineLink cardButton" href={template.fileUrl} target="_blank" rel="noreferrer">
                      Open attached file <ArrowRight size={14} />
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
            <Link className="button secondary cardButton" href="/onboarding">
              Manage resume versions <ArrowRight size={16} />
            </Link>
          </div>

          <ResumeAnalyzer />
        </section>

        <section className="section">
          <div className="grid3">
            <article className="card">
              <span className="cardIcon">
                <FileCheck2 size={20} />
              </span>
              <h3>Role-family matching</h3>
              <p>Match any pasted role or job description to the strongest saved resume version.</p>
            </article>
            <article className="card">
              <span className="cardIcon">
                <Sparkles size={20} />
              </span>
              <h3>Positioning notes</h3>
              <p>Get a short angle for what the resume should emphasize before applying.</p>
            </article>
            <article className="card">
              <span className="cardIcon">
                <Link2 size={20} />
              </span>
              <h3>Links work now</h3>
              <p>Uploaded files, pasted cloud links, comments, and parsed summaries stay attached to each resume version.</p>
            </article>
            <article className="card">
              <span className="cardIcon">
                <Upload size={20} />
              </span>
              <h3>Automatic parsing</h3>
              <p>PDF and DOCX uploads are parsed into text and role signals when the file is uploaded.</p>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
