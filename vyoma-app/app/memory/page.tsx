import { Clock3, MessageSquareText, ShieldAlert } from "lucide-react";
import { loadAssistantMemory } from "../../lib/assistant";
import { loadProfile } from "../../lib/profile";
import { Feature, Footer, MetricCard, SectionTitle, Topbar } from "../components";

const typeLabels = {
  conversation: "Conversation",
  decision: "Decision",
  risk: "Risk",
  next_action: "Next action",
};

export default function MemoryPage() {
  const memory = loadAssistantMemory();
  const profile = loadProfile();
  const recentMessages = memory.messages.slice(-10);

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section">
          <SectionTitle
            title="Memory Center"
            text="What Vyoma AI remembers from the profile, assistant conversations, tracker outcomes, and search strategy decisions."
          />
          <div className="metricGrid dashboardMetrics">
            <MetricCard value={memory.learnings.length} label="Saved learnings" />
            <MetricCard value={memory.messages.length} label="Chat messages retained" />
            <MetricCard value={profile.memory.length} label="Profile memory notes" />
            <MetricCard value={profile.agentNotes.length} label="Profile agent notes" />
          </div>
        </section>

        <section className="section memoryLayout">
          <div className="panel">
            <div className="panelHeader">
              <strong>Assistant learnings</strong>
              <span className="statusPill">Newest first</span>
            </div>
            <div className="memoryList">
              {memory.learnings.map((item) => (
                <article className="memoryItem" key={item.id}>
                  <span className="tag teal">{typeLabels[item.type]}</span>
                  <p>{item.text}</p>
                  <small>{new Date(item.createdAt).toLocaleString()}</small>
                </article>
              ))}
            </div>
          </div>

          <aside className="panel">
            <div className="panelHeader">
              <strong>Recent assistant chat</strong>
              <span className="statusPill">Last 10</span>
            </div>
            <div className="memoryChatList">
              {recentMessages.map((message, index) => (
                <div className={`chatBubble ${message.role}`} key={`${message.role}-${index}`}>
                  <span>{message.role === "assistant" ? "Vyoma AI" : "You"}</span>
                  <p>{message.content}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="section">
          <div className="grid3">
            <Feature
              icon={<Clock3 size={20} />}
              title="Daily carry-over"
              text="Memory keeps repeated priorities visible across sessions instead of restarting from zero."
            />
            <Feature
              icon={<ShieldAlert size={20} />}
              title="Outcome learning"
              text="Interviews, rejections, offers, and follow-ups become memory signals for future recommendations."
            />
            <Feature
              icon={<MessageSquareText size={20} />}
              title="Conversation trail"
              text="Recent assistant chats remain available for context and later product learning."
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
