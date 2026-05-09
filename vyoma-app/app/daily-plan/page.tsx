import { ExternalLink, MessageSquareText, Search } from "lucide-react";
import { followUpMessage, searches } from "../../lib/content";
import { loadDailyCommandAsync } from "../../lib/daily-command";
import { Feature, Footer, SectionTitle, Topbar } from "../components";
import { DailyCommandBoard } from "./daily-command-board";

export default async function DailyPlanPage() {
  const command = await loadDailyCommandAsync();

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section">
          <SectionTitle
            title="Daily Command Center"
            text="A checkable workflow for follow-ups, lead review, resume choice, search, and outreach."
          />
          <DailyCommandBoard initialCommand={command} />
        </section>

        <section className="section" id="searches">
          <SectionTitle
            title="Search Shortcuts"
            text="Open each search in LinkedIn, review manually, and capture promising job or recruiter links for AI review."
          />
          <div className="searchList">
            {searches.map((item) => (
              <a className="searchItem" href={item.url} key={item.title}>
                <span>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </span>
                <ExternalLink size={18} />
              </a>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="grid2">
            <div className="card">
              <span className="cardIcon">
                <MessageSquareText size={20} />
              </span>
              <h3>Reusable follow-up message</h3>
              <div className="messageBox">{followUpMessage}</div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="grid3">
            <Feature
              icon={<Search size={20} />}
              title="Search"
              text="Open the prepared LinkedIn searches and save the best job/recruiter links."
            />
            <Feature
              icon={<MessageSquareText size={20} />}
              title="Outreach"
              text="Send a connection note or follow-up for every high-fit role."
            />
            <Feature
              icon={<ExternalLink size={20} />}
              title="Capture"
              text="Paste promising links back into the workflow for fit scoring and message drafting."
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
