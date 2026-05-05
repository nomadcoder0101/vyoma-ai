import { Bot, BrainCircuit, KeyRound, MessageSquareText } from "lucide-react";
import { loadProfile } from "../../lib/profile";
import { Feature, Footer, SectionTitle, Topbar } from "../components";
import { AssistantChat } from "./assistant-chat";

const starterPrompts = [
  "What should I do today?",
  "How should we handle Employment Pass sponsorship?",
  "Make the strategy stronger for Singapore KYC roles.",
  "Which resume version should we use for transaction monitoring?",
];

export default function AssistantPage() {
  const profile = loadProfile();

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section">
          <SectionTitle
            title="AI Career Assistant"
            text={`Profile-aware chat for ${profile.candidateName}'s AML/KYC and Financial Crime Compliance search.`}
          />
        </section>

        <section className="section assistantLayout">
          <AssistantChat starterPrompts={starterPrompts} />

          <aside className="panel assistantSide">
            <div className="panelHeader">
              <strong>Assistant context</strong>
              <span className="statusPill">{profile.confirmed ? "Profile confirmed" : "Draft profile"}</span>
            </div>
            <span className="cardIcon">
              <BrainCircuit size={20} />
            </span>
            <h3>{profile.headline}</h3>
            <p>{profile.profileDescription}</p>
            <div className="chipList">
              {profile.targetLocations.slice(0, 5).map((location) => (
                <span className="tag teal" key={location}>
                  {location}
                </span>
              ))}
            </div>
          </aside>
        </section>

        <section className="section">
          <div className="grid3">
            <Feature
              icon={<MessageSquareText size={20} />}
              title="Ask for strategy"
              text="Daily actions, market focus, recruiter follow-up, sponsorship framing, and resume choice."
            />
            <Feature
              icon={<Bot size={20} />}
              title="Local fallback"
              text="The assistant works with local profile logic even before an OpenAI API key is configured."
            />
            <Feature
              icon={<KeyRound size={20} />}
              title="OpenAI ready"
              text="Set OPENAI_API_KEY and optionally OPENAI_MODEL to switch the backend to the Responses API."
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
