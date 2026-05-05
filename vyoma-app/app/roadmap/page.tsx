import { CheckCircle2, Circle, Clock3, Hammer } from "lucide-react";
import { roadmap } from "../../lib/roadmap";
import { Footer, MetricCard, SectionTitle, Topbar } from "../components";

const statusMeta = {
  done: { label: "Done", icon: CheckCircle2, className: "teal" },
  in_progress: { label: "In progress", icon: Hammer, className: "amber" },
  next: { label: "Next", icon: Clock3, className: "amber" },
  planned: { label: "Planned", icon: Circle, className: "teal" },
};

export default function RoadmapPage() {
  const counts = roadmap.reduce(
    (acc, item) => ({ ...acc, [item.status]: acc[item.status] + 1 }),
    { done: 0, in_progress: 0, next: 0, planned: 0 },
  );

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section">
          <SectionTitle
            title="Build Roadmap"
            text="The full app broken into product areas, current status, and what remains before production launch."
          />
          <div className="metricGrid dashboardMetrics">
            <MetricCard value={counts.done} label="Completed slices" />
            <MetricCard value={counts.in_progress} label="In progress" />
            <MetricCard value={counts.next} label="Next build item" />
            <MetricCard value={counts.planned} label="Planned production items" />
          </div>
        </section>

        <section className="section roadmapGrid">
          {roadmap.map((item) => {
            const meta = statusMeta[item.status];
            const Icon = meta.icon;
            return (
              <article className="roadmapItem" key={`${item.area}-${item.title}`}>
                <div className="roadmapTop">
                  <span className="cardIcon">
                    <Icon size={20} />
                  </span>
                  <span className={`tag ${meta.className}`}>{meta.label}</span>
                </div>
                <span className="roadmapArea">{item.area}</span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            );
          })}
        </section>
      </main>
      <Footer />
    </div>
  );
}
