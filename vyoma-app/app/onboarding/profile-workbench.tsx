"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, BrainCircuit, FileText, Plus, Send, Save, Sparkles } from "lucide-react";
import type { CareerProfile } from "../../lib/profile";

export function ProfileWorkbench({ initialProfile }: { initialProfile: CareerProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState("");
  const [agentInstruction, setAgentInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = useMemo(() => buildPreview(profile), [profile]);

  function updateField<K extends keyof CareerProfile>(key: K, value: CareerProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value, confirmed: false }));
  }

  function updateList(key: "targetLocations" | "targetRoles" | "coreSkills" | "constraints" | "memory", value: string) {
    updateField(
      key,
      value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean) as CareerProfile[typeof key],
    );
  }

  function updateResume(index: number, key: "name" | "focus" | "notes", value: string) {
    setProfile((current) => ({
      ...current,
      confirmed: false,
      resumeTemplates: current.resumeTemplates.map((template, templateIndex) =>
        templateIndex === index ? { ...template, [key]: value } : template,
      ),
    }));
  }

  function addResumeTemplate() {
    setProfile((current) => ({
      ...current,
      confirmed: false,
      resumeTemplates: [
        ...current.resumeTemplates,
        { name: "New resume / CV version", focus: "Target role or job family", notes: "Paste file name, link, or notes on when to use this resume." },
      ],
    }));
  }

  async function saveProfile(confirmed: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, confirmed }),
      });

      if (!response.ok) {
        setMessage("Could not save profile. Please check required fields.");
        return;
      }

      const body = (await response.json()) as { profile: CareerProfile };
      setProfile(body.profile);
      setMessage(confirmed ? "Profile confirmed and saved." : "Profile draft saved.");
    } catch {
      setMessage("Could not reach the profile service. Check that the dev server is running.");
    } finally {
      setBusy(false);
    }
  }

  async function runAgentEdit() {
    if (!agentInstruction.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "agent_edit", instruction: agentInstruction }),
      });
      if (!response.ok) {
        setMessage("Agent could not update the profile.");
        return;
      }
      const body = (await response.json()) as { profile: CareerProfile };
      setProfile(body.profile);
      setAgentInstruction("");
      setMessage("Agent updated the profile draft. Review and confirm when ready.");
    } catch {
      setMessage("Could not reach the profile agent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profileWorkbench">
      <div className="panel profileFormPanel">
        <div className="panelHeader">
          <strong>Profile inputs</strong>
          <span className="statusPill">{profile.confirmed ? "Confirmed" : "Draft"}</span>
        </div>
        <div className="confirmStrip">
          <div>
            <strong>{profile.confirmed ? "Profile confirmed" : "Profile needs confirmation"}</strong>
            <span>
              Confirmation makes this profile the source for dashboard recommendations,
              lead scoring, and outreach drafts.
            </span>
          </div>
          <form action="/api/profile/confirm" method="post">
            <input name="profile" type="hidden" value={JSON.stringify(profile)} />
            <button className="button primary" type="submit">
              <BadgeCheck size={16} /> Confirm profile
            </button>
          </form>
        </div>

        <div className="profileForm">
          <label>
            Candidate name
            <input
              value={profile.candidateName}
              onChange={(event) => updateField("candidateName", event.target.value)}
            />
          </label>
          <label>
            Headline
            <input
              value={profile.headline}
              onChange={(event) => updateField("headline", event.target.value)}
            />
          </label>
          <label>
            Current location
            <input
              value={profile.currentLocation}
              onChange={(event) => updateField("currentLocation", event.target.value)}
            />
          </label>
          <label>
            Salary expectation
            <input
              value={profile.salaryExpectation}
              onChange={(event) => updateField("salaryExpectation", event.target.value)}
            />
          </label>
          <label className="wide">
            Work authorization
            <textarea
              rows={3}
              value={profile.workAuthorization}
              onChange={(event) => updateField("workAuthorization", event.target.value)}
            />
          </label>
          <label className="wide">
            Profile description
            <textarea
              rows={5}
              value={profile.profileDescription}
              onChange={(event) => updateField("profileDescription", event.target.value)}
            />
          </label>
          <label className="wide">
            Reason for job change
            <textarea
              rows={4}
              value={profile.reasonForChange}
              onChange={(event) => updateField("reasonForChange", event.target.value)}
            />
          </label>
          <label>
            Target locations
            <textarea
              rows={6}
              value={profile.targetLocations.join("\n")}
              onChange={(event) => updateList("targetLocations", event.target.value)}
            />
          </label>
          <label>
            Target roles
            <textarea
              rows={6}
              value={profile.targetRoles.join("\n")}
              onChange={(event) => updateList("targetRoles", event.target.value)}
            />
          </label>
          <label>
            Core skills
            <textarea
              rows={7}
              value={profile.coreSkills.join("\n")}
              onChange={(event) => updateList("coreSkills", event.target.value)}
            />
          </label>
          <label>
            Constraints and strategy notes
            <textarea
              rows={7}
              value={profile.constraints.join("\n")}
              onChange={(event) => updateList("constraints", event.target.value)}
            />
          </label>
          <label className="wide">
            Agent memory
            <textarea
              rows={5}
              value={profile.memory.join("\n")}
              onChange={(event) => updateList("memory", event.target.value)}
            />
          </label>
        </div>

        <div className="resumeEditor">
          <div className="sectionTitle compact">
            <div>
              <h2>Attached resumes / CV versions</h2>
              <p>
                Add each resume version you want the assistant to consider. For now,
                store the file name, cloud link, and usage notes here.
              </p>
            </div>
            <button className="button secondary" onClick={addResumeTemplate} type="button">
              <Plus size={16} /> Add resume
            </button>
          </div>
          <div className="resumeAttachmentGrid">
            {profile.resumeTemplates.map((template, index) => (
              <article className="resumeAttachment" key={`${template.name}-summary-${index}`}>
                <span className="cardIcon">
                  <FileText size={20} />
                </span>
                <div>
                  <strong>{template.name}</strong>
                  <span>{template.focus}</span>
                  <p>{template.notes}</p>
                </div>
              </article>
            ))}
          </div>
          {profile.resumeTemplates.map((template, index) => (
            <div className="resumeRow" key={`${template.name}-${index}`}>
              <span className="resumeRowLabel">Resume {index + 1}</span>
              <input
                aria-label="Resume file name or version"
                placeholder="File name or version label"
                value={template.name}
                onChange={(event) => updateResume(index, "name", event.target.value)}
              />
              <input
                aria-label="Resume target focus"
                placeholder="Target role or job family"
                value={template.focus}
                onChange={(event) => updateResume(index, "focus", event.target.value)}
              />
              <textarea
                aria-label="Resume notes or link"
                placeholder="Paste OneDrive/Google Drive link, original file name, or notes on when to use this resume."
                rows={2}
                value={template.notes}
                onChange={(event) => updateResume(index, "notes", event.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="formActions">
          <button className="button secondary" onClick={() => saveProfile(false)} type="button">
            <Save size={16} /> Save draft
          </button>
          <form action="/api/profile/confirm" method="post">
            <input name="profile" type="hidden" value={JSON.stringify(profile)} />
            <button className="button primary" type="submit">
              <BadgeCheck size={16} /> Confirm profile
            </button>
          </form>
          {message ? <span className="formMessage">{message}</span> : null}
        </div>
      </div>

      <aside className="panel profilePreview">
        <div className="panelHeader">
          <strong>Agent profile preview</strong>
          <span className="statusPill">Local AI brief</span>
        </div>
        <span className="cardIcon">
          <BrainCircuit size={20} />
        </span>
        <h3>{profile.candidateName}</h3>
        <div className="messageBox">{preview}</div>
        <div className="agentChatBox">
          <strong>Ask the profile agent</strong>
          <textarea
            rows={4}
            placeholder="Example: make this stronger for Singapore KYC roles, but soften the sponsorship wording."
            value={agentInstruction}
            onChange={(event) => setAgentInstruction(event.target.value)}
          />
          <button
            className="button primary"
            disabled={busy || !agentInstruction.trim()}
            onClick={runAgentEdit}
            type="button"
          >
            <Send size={16} /> Apply agent edit
          </button>
        </div>
        {profile.agentNotes?.length ? (
          <div className="agentNotes">
            <strong>Memory notes</strong>
            {profile.agentNotes.slice(0, 5).map((note) => (
              <div className="agentNote" key={note.id}>
                <span className="tag teal">{note.type.replace("_", " ")}</span>
                <p>{note.text}</p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="agentSuggestion">
          <Sparkles size={18} />
          <span>
            This is a local rules-based agent for the pilot. Later we connect it to
            your ChatGPT/OpenAI assistant for richer conversational edits.
          </span>
        </div>
      </aside>
    </div>
  );
}

function buildPreview(profile: CareerProfile) {
  return [
    `${profile.candidateName} should be positioned as: ${profile.headline}.`,
    "",
    `Core pitch: ${profile.profileDescription}`,
    "",
    `Change context: ${profile.reasonForChange}`,
    "",
    `Target markets: ${profile.targetLocations.join(", ")}.`,
    `Target roles: ${profile.targetRoles.join(", ")}.`,
    `Work authorization: ${profile.workAuthorization}`,
    "",
    `Agent memory: ${profile.memory.join(" ")}`,
  ].join("\n");
}
