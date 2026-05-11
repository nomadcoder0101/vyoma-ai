"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, BrainCircuit, Download, ExternalLink, FileText, Info, Plus, Send, Save, Sparkles, Upload } from "lucide-react";
import type { CareerProfile } from "../../lib/profile";

type ProfileChatMessage = {
  role: "assistant" | "user";
  text: string;
};

export function ProfileWorkbench({
  confirmedNotice = false,
  initialProfile,
}: {
  confirmedNotice?: boolean;
  initialProfile: CareerProfile;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState(confirmedNotice ? "Profile confirmed and saved." : "");
  const [agentInstruction, setAgentInstruction] = useState("");
  const [profileChat, setProfileChat] = useState<ProfileChatMessage[]>([
    {
      role: "assistant",
      text: "I can help tune this profile. Ask me to sharpen a headline, soften authorization wording, or adapt the profile for a role.",
    },
  ]);
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

  function updateResume(index: number, key: "name" | "focus" | "notes" | "fileUrl" | "userComment", value: string) {
    setProfile((current) => ({
      ...current,
      confirmed: false,
      resumeTemplates: current.resumeTemplates.map((template, templateIndex) =>
        templateIndex === index ? { ...template, [key]: value } : template,
      ),
    }));
  }

  async function uploadResume(index: number, file: File | null) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as {
        fileName?: string;
        fileUrl?: string;
        size?: number;
        contentType?: string;
        fullText?: string;
        parsedSummary?: CareerProfile["resumeTemplates"][number]["parsedSummary"];
        uploadedAt?: string;
        error?: string;
      };
      if (!response.ok || !body.fileUrl) {
        setMessage(body.error || "Could not upload resume.");
        return;
      }
      const uploadedUrl = body.fileUrl;
      const uploadedName = body.fileName;
      setProfile((current) => ({
        ...current,
        confirmed: false,
        resumeTemplates: current.resumeTemplates.map((template, templateIndex) =>
          templateIndex === index
            ? {
                ...template,
                name: template.name.startsWith("New resume") ? uploadedName || template.name : template.name,
                fileUrl: uploadedUrl,
                fileName: uploadedName,
                fileSize: body.size,
                contentType: body.contentType,
                fullText: body.fullText,
                parsedSummary: body.parsedSummary,
                uploadedAt: body.uploadedAt,
                notes: template.notes.includes(uploadedUrl)
                  ? template.notes
                  : `${template.notes}\nUploaded file: ${uploadedUrl}`.trim(),
              }
            : template,
        ),
      }));
      setMessage("Resume uploaded and parsed. Save the profile to keep this file attached.");
    } catch {
      setMessage("Could not reach the resume upload service.");
    } finally {
      setBusy(false);
    }
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
    const instruction = agentInstruction.trim();
    setProfileChat((current) => [...current, { role: "user", text: instruction }]);
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "agent_edit", instruction }),
      });
      if (!response.ok) {
        setMessage("Agent could not update the profile.");
        setProfileChat((current) => [
          ...current,
          { role: "assistant", text: "I could not update the draft. Please try again with a shorter instruction." },
        ]);
        return;
      }
      const body = (await response.json()) as { profile: CareerProfile };
      setProfile(body.profile);
      setAgentInstruction("");
      setMessage("Agent updated the profile draft. Review and confirm when ready.");
      setProfileChat((current) => [
        ...current,
        { role: "assistant", text: "I updated the draft and marked it for review. Check the profile preview and confirm when it feels right." },
      ]);
    } catch {
      setMessage("Could not reach the profile agent.");
      setProfileChat((current) => [
        ...current,
        { role: "assistant", text: "I could not reach the profile agent service. The draft is unchanged." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profileWorkbench">
      <div className="panel profileFormPanel">
        <div className="panelHeader warmHeader">
          <strong>Profile workspace</strong>
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
          <button className="button primary" disabled={busy} onClick={() => saveProfile(true)} type="button">
            <BadgeCheck size={16} /> Confirm profile
          </button>
        </div>
        {message ? <div className="inlineNotice profileSaveNotice">{message}</div> : null}

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
          <label className="wide memoryLabel">
            <span>
              Agent memory
              <span className="infoHint" title="Memory is the durable context the assistant uses: preferences, risks, lessons from applications, and reminders that should shape future recommendations.">
                <Info size={14} />
              </span>
            </span>
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
                Add each resume version you want the assistant to consider. Upload a
                PDF/DOC/DOCX when blob storage is configured, or paste a cloud link
                and usage notes.
              </p>
            </div>
            <button className="button secondary" onClick={addResumeTemplate} type="button">
              <Plus size={16} /> Add resume
            </button>
          </div>
          {profile.resumeTemplates.map((template, index) => (
            <div className="resumeRow" key={`${template.name}-${index}`}>
              <div className="resumeCardHeader">
                <span className="cardIcon">
                  <FileText size={20} />
                </span>
                <div>
                  <span className="resumeRowLabel">Resume {index + 1}</span>
                  <strong>{template.name || "Untitled resume"}</strong>
                  <p>{template.focus}</p>
                </div>
                <div className="resumeQuickActions">
                  {template.fullText || template.fileUrl ? (
                    <a className="button secondary" href={`/api/resume/download?index=${index}`}>
                      <Download size={14} /> Download
                    </a>
                  ) : null}
                  {template.fileUrl ? (
                    <a className="iconOnly" href={template.fileUrl} target="_blank" rel="noreferrer" aria-label="Open attached file">
                      <ExternalLink size={16} />
                    </a>
                  ) : null}
                </div>
              </div>
              {template.parsedSummary ? (
                <div className="resumeParseSummary">
                  <span className={`tag ${template.parsedSummary.status === "parsed" ? "teal" : "amber"}`}>
                    {template.parsedSummary.status || "pending"}
                  </span>
                  <span>{template.parsedSummary.wordCount || 0} words parsed</span>
                  {template.parsedSummary.roleSignals?.slice(0, 3).map((signal) => (
                    <span key={signal}>{signal}</span>
                  ))}
                </div>
              ) : null}
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
              <textarea
                aria-label="Resume comment"
                placeholder="Add your comment for this resume: strengths, concerns, best role type, or follow-up note."
                rows={2}
                value={template.userComment || ""}
                onChange={(event) => updateResume(index, "userComment", event.target.value)}
              />
              <input
                aria-label="Attached resume file URL"
                placeholder="Attached file URL"
                value={template.fileUrl || ""}
                onChange={(event) => updateResume(index, "fileUrl", event.target.value)}
              />
              {!template.fileUrl ? (
                <label className="resumeUploadControl">
                  <Upload size={16} /> Upload PDF/DOC/DOCX
                  <input
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    disabled={busy}
                    type="file"
                    onChange={(event) => uploadResume(index, event.target.files?.[0] || null)}
                  />
                </label>
              ) : null}
            </div>
          ))}
        </div>

        <div className="formActions">
          <button className="button secondary" onClick={() => saveProfile(false)} type="button">
            <Save size={16} /> Save draft
          </button>
          <button className="button primary" disabled={busy} onClick={() => saveProfile(true)} type="button">
            <BadgeCheck size={16} /> Confirm profile
          </button>
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
          <strong>Profile agent chat</strong>
          <div className="miniChatTranscript">
            {profileChat.map((item, index) => (
              <div className={`miniChatBubble ${item.role}`} key={`${item.role}-${index}`}>
                <span>{item.role === "assistant" ? "Profile agent" : "You"}</span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
          <textarea
            rows={4}
            placeholder="Example: make this warmer for a risk manager role, but keep work authorization clear."
            value={agentInstruction}
            onChange={(event) => setAgentInstruction(event.target.value)}
          />
          <button
            className="button primary"
            disabled={busy || !agentInstruction.trim()}
            onClick={runAgentEdit}
            type="button"
          >
            <Send size={16} /> Send to profile agent
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
            This profile editor applies focused changes to the draft. Use the
            Assistant page for richer OpenAI-backed strategy and wording help.
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
