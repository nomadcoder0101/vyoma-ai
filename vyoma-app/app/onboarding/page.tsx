import { BrainCircuit, FileText, ShieldCheck, UserRoundCheck } from "lucide-react";
import { loadProfileAsync, profileCompleteness } from "../../lib/profile";
import { Feature, Footer, MetricCard, SectionTitle, Topbar } from "../components";
import { ProfileWorkbench } from "./profile-workbench";

export default async function OnboardingPage() {
  const profile = await loadProfileAsync();
  const completion = profileCompleteness(profile);

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section">
          <SectionTitle
            title="Profile Setup"
            text="Build the Career Ops profile that powers daily search, lead scoring, outreach, and memory."
          />
          <div className="metricGrid dashboardMetrics">
            <MetricCard value={`${completion}%`} label="Profile completeness" />
            <MetricCard value={profile.resumeTemplates.length} label="Resume templates mapped" />
            <MetricCard value={profile.targetLocations.length} label="Target markets" />
            <MetricCard value={profile.confirmed ? "Yes" : "No"} label="Profile confirmed" />
          </div>
        </section>

        <section className="section">
          <ProfileWorkbench initialProfile={profile} />
        </section>

        <section className="section">
          <div className="grid3">
            <Feature
              icon={<UserRoundCheck size={20} />}
              title="Profile"
              text="Capture positioning, authorization, target roles, locations, and constraints."
            />
            <Feature
              icon={<FileText size={20} />}
              title="Resume map"
              text="Connect each resume version to the roles where it should be used."
            />
            <Feature
              icon={<BrainCircuit size={20} />}
              title="Memory"
              text="Preserve what the agent learns from applications, leads, and outcomes."
            />
          </div>
        </section>

        <section className="section">
          <div className="card">
            <span className="cardIcon">
              <ShieldCheck size={20} />
            </span>
            <h3>Important boundary</h3>
            <p>
              Profile data is scoped to the signed-in account and stored in
              Postgres in production. Next production slices are secure resume
              uploads, managed auth, and official OAuth-based integrations.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
