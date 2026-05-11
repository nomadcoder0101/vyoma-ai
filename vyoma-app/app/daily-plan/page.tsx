import { followUpMessage, searches } from "../../lib/content";
import { loadDailyCommandAsync } from "../../lib/daily-command";
import { Footer, SectionTitle, Topbar } from "../components";
import { DailyCommandBoard } from "./daily-command-board";
import { OutreachCoach, SearchShortcutBoard } from "./daily-tools";

export default async function DailyPlanPage() {
  const command = await loadDailyCommandAsync();

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section">
          <SectionTitle
            title="Daily Command Center"
            text="Start with one small action. Mark it done, then move to the next. No guessing."
          />
          <DailyCommandBoard initialCommand={command} />
        </section>

        <section className="section" id="searches">
          <SectionTitle
            title="Search Shortcuts"
            text="Use the saved searches, or add your own when you discover a better route."
          />
          <SearchShortcutBoard initialSearches={searches} />
        </section>

        <section className="section">
          <OutreachCoach baseMessage={followUpMessage} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
