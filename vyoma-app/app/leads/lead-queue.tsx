"use client";

import { useState } from "react";
import {
  Archive,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  FileCheck2,
  FilePlus2,
  FileSearch,
  MessageSquareText,
  RotateCcw,
} from "lucide-react";
import type { Lead } from "../../lib/leads";
import { formatDate } from "../components";

type LeadStatus = Lead["status"];
type LeadAction = "evaluate" | "draft" | "resume" | "contacted" | "archive" | "restore" | "convert";

const filters: Array<LeadStatus | "active" | "all"> = [
  "active",
  "new",
  "evaluated",
  "drafted",
  "contacted",
  "archived",
  "all",
];

export function LeadQueue({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<LeadStatus | "active" | "all">("active");
  const [notice, setNotice] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  async function runAction(id: string, action: LeadAction) {
    setBusyId(id);
    setNotice("");
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setBusyId(null);

    if (!response.ok) return;
    const body = (await response.json()) as { lead: Lead; trackerRow?: string };
    setLeads((current) =>
      current.map((lead) => (lead.id === body.lead.id ? body.lead : lead)),
    );
    if (body.trackerRow) {
      setNotice("Lead added to the application tracker.");
    }
  }

  async function copyText(text: string | undefined, key: string) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 1600);
  }

  if (leads.length === 0) {
    return (
      <div className="emptyState">
        <FileSearch size={32} />
        <strong>No leads yet</strong>
        <span>Open the Daily Plan, search LinkedIn, and paste useful links here.</span>
      </div>
    );
  }

  const visibleLeads = leads.filter((lead) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return lead.status !== "archived";
    return lead.status === activeFilter;
  });

  return (
    <>
      <div className="leadToolbar">
        <div className="segmentedControl" aria-label="Filter leads by status">
          {filters.map((filter) => (
            <button
              aria-pressed={activeFilter === filter}
              className={activeFilter === filter ? "active" : ""}
              key={filter}
              onClick={() => setActiveFilter(filter)}
              type="button"
            >
              {filter === "active" ? "active" : filter}
            </button>
          ))}
        </div>
        <span>{visibleLeads.length} shown</span>
      </div>

      {notice ? <div className="inlineNotice">{notice}</div> : null}

      {visibleLeads.length === 0 ? (
        <div className="emptyState">
          <FileSearch size={32} />
          <strong>No leads in this filter</strong>
          <span>Try active or all to bring hidden leads back into view.</span>
        </div>
      ) : null}

      <div className="leadCards">
        {visibleLeads.map((lead) => (
        <article className="leadCard" key={lead.id}>
          <div className="leadTop">
            <div>
              <span className="tag teal">{lead.type}</span>
              <h3>{lead.title}</h3>
              <p>{lead.company || "Company not set"}</p>
            </div>
            <span className={`tag ${lead.status === "archived" ? "amber" : "teal"}`}>
              {lead.status}
            </span>
          </div>

          <div className="leadSignal">
            <strong>{lead.score ? `${lead.score}/5` : "Not scored"}</strong>
            <span>{lead.nextAction || nextActionFor(lead)}</span>
          </div>

          {lead.notes ? <p className="leadNotes">{lead.notes}</p> : null}

          <div className="leadMeta">
            Saved {formatDate(lead.createdAt.slice(0, 10))}
            <a className="inlineLink" href={lead.url}>
              Open link <ExternalLink size={14} />
            </a>
          </div>

          <div className="leadActions">
            <button
              className="button secondary"
              disabled={busyId === lead.id}
              onClick={() => runAction(lead.id, "evaluate")}
              type="button"
            >
              <FileSearch size={16} /> Evaluate
            </button>
            <button
              className="button secondary"
              disabled={busyId === lead.id}
              onClick={() => runAction(lead.id, "draft")}
              type="button"
            >
              <MessageSquareText size={16} /> Draft outreach
            </button>
            <button
              className="button secondary"
              disabled={busyId === lead.id}
              onClick={() => runAction(lead.id, "resume")}
              type="button"
            >
              <FileCheck2 size={16} /> Recommend resume
            </button>
            <button
              className="button secondary"
              disabled={busyId === lead.id}
              onClick={() => runAction(lead.id, "convert")}
              type="button"
            >
              <FilePlus2 size={16} /> Add to tracker
            </button>
            <button
              className="button secondary"
              disabled={busyId === lead.id}
              onClick={() => runAction(lead.id, "contacted")}
              type="button"
            >
              <CheckCircle2 size={16} /> Mark contacted
            </button>
            <button
              className="button secondary"
              disabled={busyId === lead.id}
              onClick={() => runAction(lead.id, lead.status === "archived" ? "restore" : "archive")}
              type="button"
            >
              {lead.status === "archived" ? <RotateCcw size={16} /> : <Archive size={16} />}
              {lead.status === "archived" ? "Restore" : "Archive"}
            </button>
          </div>

          {lead.evaluation ? (
            <div className="messageBlock">
              <div className="messageBlockHeader">
                <strong>Evaluation</strong>
                <button
                  className="iconTextButton"
                  onClick={() => copyText(lead.evaluation, `${lead.id}-evaluation`)}
                  type="button"
                >
                  <Clipboard size={14} />
                  {copiedKey === `${lead.id}-evaluation` ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="messageBox">{lead.evaluation}</div>
            </div>
          ) : null}

          {lead.outreachDraft ? (
            <div className="messageBlock">
              <div className="messageBlockHeader">
                <strong>Outreach draft</strong>
                <button
                  className="iconTextButton"
                  onClick={() => copyText(lead.outreachDraft, `${lead.id}-draft`)}
                  type="button"
                >
                  <Clipboard size={14} />
                  {copiedKey === `${lead.id}-draft` ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="messageBox">{lead.outreachDraft}</div>
            </div>
          ) : null}

          {lead.resumeRecommendation ? (
            <div className="messageBlock">
              <div className="messageBlockHeader">
                <strong>Resume recommendation</strong>
                <button
                  className="iconTextButton"
                  onClick={() =>
                    copyText(
                      formatResumeRecommendation(lead),
                      `${lead.id}-resume`,
                    )
                  }
                  type="button"
                >
                  <Clipboard size={14} />
                  {copiedKey === `${lead.id}-resume` ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="leadResumeResult">
                <div className="leadSignal">
                  <strong>{lead.resumeRecommendation.recommended.name}</strong>
                  <span>{lead.resumeRecommendation.score}/5 match</span>
                </div>
                <div className="messageBox">{lead.resumeRecommendation.reason}</div>
                <div className="messageBox">{lead.resumeRecommendation.positioning}</div>
                <div className="chipList resumeChips">
                  {lead.resumeRecommendation.keywords.length ? (
                    lead.resumeRecommendation.keywords.map((keyword) => (
                      <span className="tag teal" key={keyword}>
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <span className="tag amber">Manual review</span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </article>
        ))}
      </div>
    </>
  );
}

function formatResumeRecommendation(lead: Lead) {
  if (!lead.resumeRecommendation) return "";
  return [
    `Lead: ${lead.title}`,
    `Company: ${lead.company || "Company not set"}`,
    `Recommended resume: ${lead.resumeRecommendation.recommended.name}`,
    `Score: ${lead.resumeRecommendation.score}/5`,
    `Reason: ${lead.resumeRecommendation.reason}`,
    `Positioning: ${lead.resumeRecommendation.positioning}`,
    `Keywords: ${lead.resumeRecommendation.keywords.join(", ") || "Manual review"}`,
  ].join("\n");
}

function nextActionFor(lead: Lead) {
  if (lead.status === "new") return "Evaluate fit before spending outreach energy.";
  if (lead.status === "evaluated") return "Draft outreach if the score and visa fit look promising.";
  if (lead.status === "drafted") return "Send or personalize the message, then mark contacted.";
  if (lead.status === "contacted") return "Track follow-up timing and recruiter response.";
  return "Hidden by default. Restore if it becomes relevant again.";
}
