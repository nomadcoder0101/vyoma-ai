import { loadProfileAsync, profileCompleteness } from "../../lib/profile";
import { Footer, MetricCard, SectionTitle, Topbar } from "../components";
import { ProfileWorkbench } from "./profile-workbench";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ confirmed?: string }>;
}) {
  const profile = await loadProfileAsync();
  const completion = profileCompleteness(profile);
  const params = (await searchParams) || {};

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
          <ProfileWorkbench
            confirmedNotice={params.confirmed === "1"}
            initialProfile={profile}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
