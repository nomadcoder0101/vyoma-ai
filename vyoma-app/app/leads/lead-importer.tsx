"use client";

import { useState } from "react";
import { FilePlus2, SearchCheck } from "lucide-react";
import type { Lead } from "../../lib/leads";
import type { LeadImportPreview } from "../../lib/lead-import";

const sample = `Senior KYC Analyst
Company: Example Bank
Location: Singapore
CDD, EDD, client onboarding, beneficial ownership, sanctions, PEP, adverse media, regulatory documentation.
Employment Pass / work authorization will be discussed with shortlisted candidates.
https://www.linkedin.com/jobs/view/example`;

export function LeadImporter() {
  const [rawText, setRawText] = useState(sample);
  const [preview, setPreview] = useState<LeadImportPreview | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function run(mode: "preview" | "import") {
    if (!rawText.trim() || busy) return;
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText, mode }),
    });
    setBusy(false);

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setMessage(body.error || "Could not import lead.");
      return;
    }

    const body = (await response.json()) as {
      preview?: LeadImportPreview;
      lead?: Lead;
    };
    if (mode === "preview" && body.preview) {
      setPreview(body.preview);
      setLead(null);
    }
    if (mode === "import" && body.lead) {
      setLead(body.lead);
      setPreview(null);
      setMessage("Lead imported with evaluation, outreach draft, and resume recommendation.");
    }
  }

  return (
    <div className="leadImporter">
      <label>
        Raw job post, LinkedIn text, or JD snippet
        <textarea
          rows={8}
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
        />
      </label>
      <div className="leadActions">
        <button className="button secondary" disabled={busy || !rawText.trim()} onClick={() => run("preview")} type="button">
          <SearchCheck size={16} /> Preview extraction
        </button>
        <button className="button primary" disabled={busy || !rawText.trim()} onClick={() => run("import")} type="button">
          <FilePlus2 size={16} /> Import and analyze
        </button>
      </div>
      {message ? <span className="formMessage">{message}</span> : null}

      {preview ? (
        <div className="messageBox">
          <strong>Preview</strong>
          {"\n"}
          Title: {preview.title}
          {"\n"}
          Company: {preview.company || "Not detected"}
          {"\n"}
          Location: {preview.location || "Not detected"}
          {"\n"}
          Sponsorship: {preview.sponsorshipClues.join(", ") || "No clue detected"}
        </div>
      ) : null}

      {lead ? (
        <div className="leadImportResult">
          <div className="leadSignal">
            <strong>{lead.title}</strong>
            <span>{lead.company || "Company not set"}</span>
          </div>
          {lead.evaluation ? <div className="messageBox">{lead.evaluation}</div> : null}
          {lead.resumeRecommendation ? (
            <div className="messageBox">
              Recommended resume: {lead.resumeRecommendation.recommended.name}
              {"\n"}
              {lead.resumeRecommendation.positioning}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
