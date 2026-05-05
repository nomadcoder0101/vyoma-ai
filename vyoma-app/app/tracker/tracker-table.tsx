"use client";

import { useState } from "react";
import { CheckCircle2, MessageSquareText, XCircle } from "lucide-react";
import type { Application, PipelineStatus } from "../../lib/tracker";
import { formatDate } from "../components";

const statusActions: Array<{
  label: string;
  status: PipelineStatus;
}> = [
  { label: "Follow-up sent", status: "follow_up_sent" },
  { label: "Interview", status: "interview" },
  { label: "Rejected", status: "rejected" },
  { label: "Offer", status: "offer" },
  { label: "Closed", status: "closed" },
];

export function TrackerTable({ initialApps }: { initialApps: Application[] }) {
  const [apps, setApps] = useState(initialApps);
  const [busyNum, setBusyNum] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState("");

  async function updateStatus(num: number, pipelineStatus: PipelineStatus) {
    setBusyNum(num);
    setNotice("");
    const response = await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        num,
        pipelineStatus,
        note: notes[num] || "",
      }),
    });
    setBusyNum(null);

    if (!response.ok) {
      setNotice("Could not update tracker action.");
      return;
    }

    const body = (await response.json()) as {
      application: Application;
      learning?: { text: string };
    };
    setApps((current) =>
      current.map((app) => (app.num === body.application.num ? body.application : app)),
    );
    setNotes((current) => ({ ...current, [num]: "" }));
    setNotice(
      body.learning
        ? `Updated #${num} and saved outcome learning.`
        : `Updated #${num}.`,
    );
  }

  return (
    <>
      {notice ? <div className="inlineNotice">{notice}</div> : null}
      <div className="trackerCards">
        {apps.map((app) => (
          <article className="trackerCard" key={app.num}>
            <div className="trackerCardTop">
              <div>
                <span className="tag teal">#{app.num}</span>
                <h3>{app.company}</h3>
                <p>{app.role}</p>
              </div>
              <span className={`tag ${statusClass(app.pipelineStatus || app.status)}`}>
                {labelStatus(app.pipelineStatus || app.status)}
              </span>
            </div>

            <div className="trackerMeta">
              <span>Applied {formatDate(app.date)}</span>
              <span>{app.bucket}</span>
              <span className={`tag ${app.urgency === "waiting" ? "teal" : app.urgency === "due" ? "amber" : "red"}`}>
                {app.urgency}
              </span>
            </div>

            {app.actionNotes ? (
              <div className="messageBox">
                <strong>Action notes</strong>
                {"\n"}
                {app.actionNotes}
              </div>
            ) : null}

            <div className="trackerActionRow">
              <label>
                Add note
                <textarea
                  rows={2}
                  value={notes[app.num] || ""}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [app.num]: event.target.value }))
                  }
                  placeholder="Recruiter followed up, interview scheduled, rejection reason..."
                />
              </label>
              <div className="leadActions">
                {statusActions.map((action) => (
                  <button
                    className="button secondary"
                    disabled={busyNum === app.num}
                    key={action.status}
                    onClick={() => updateStatus(app.num, action.status)}
                    type="button"
                  >
                    {action.status === "rejected" || action.status === "closed" ? (
                      <XCircle size={16} />
                    ) : action.status === "follow_up_sent" ? (
                      <MessageSquareText size={16} />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function labelStatus(status: string) {
  return status.replace(/_/g, " ");
}

function statusClass(status: string) {
  if (status === "rejected" || status === "closed") return "red";
  if (status === "interview" || status === "offer") return "amber";
  return "teal";
}
