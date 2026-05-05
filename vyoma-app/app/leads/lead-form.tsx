"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type LeadType = "job" | "recruiter" | "company";

export function LeadForm() {
  const [type, setType] = useState<LeadType>("job");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, url, title, company, notes }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setMessage(body.error || "Unable to save lead.");
      setIsSaving(false);
      return;
    }

    setUrl("");
    setTitle("");
    setCompany("");
    setNotes("");
    setMessage("Lead saved. Refreshing queue...");
    setIsSaving(false);
    window.location.reload();
  }

  return (
    <form className="leadForm" onSubmit={submit}>
      <label>
        Type
        <select value={type} onChange={(event) => setType(event.target.value as LeadType)}>
          <option value="job">Job</option>
          <option value="recruiter">Recruiter / profile</option>
          <option value="company">Company</option>
        </select>
      </label>
      <label>
        URL
        <input
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://www.linkedin.com/jobs/view/..."
          required
          type="url"
          value={url}
        />
      </label>
      <label>
        Title or contact name
        <input
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Transaction Monitoring Analyst / Recruiter name"
          value={title}
        />
      </label>
      <label>
        Company
        <input
          onChange={(event) => setCompany(event.target.value)}
          placeholder="Company name"
          value={company}
        />
      </label>
      <label className="wide">
        Notes
        <textarea
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Why this looks promising, recruiter context, sponsorship clue, etc."
          rows={4}
          value={notes}
        />
      </label>
      <div className="formActions">
        <button className="button primary" disabled={isSaving} type="submit">
          <Plus size={16} />
          {isSaving ? "Saving..." : "Save lead"}
        </button>
        {message ? <span className="formMessage">{message}</span> : null}
      </div>
    </form>
  );
}
