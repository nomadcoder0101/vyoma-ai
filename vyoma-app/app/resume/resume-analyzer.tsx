"use client";

import { useState } from "react";
import { Clipboard, SearchCheck } from "lucide-react";
import type { ResumeRecommendation } from "../../lib/resume-studio";

const sampleText =
  "Senior KYC Analyst role in Singapore covering CDD, EDD, client onboarding, sanctions screening, beneficial ownership review, and regulatory documentation.";

export function ResumeAnalyzer() {
  const [input, setInput] = useState(sampleText);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recommendation, setRecommendation] = useState<ResumeRecommendation | null>(null);

  async function analyze() {
    if (!input.trim() || busy) return;
    setBusy(true);
    const response = await fetch("/api/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    setBusy(false);

    if (!response.ok) return;
    const body = (await response.json()) as { recommendation: ResumeRecommendation };
    setRecommendation(body.recommendation);
  }

  async function copyPositioning() {
    if (!recommendation) return;
    await navigator.clipboard.writeText(
      [
        `Recommended resume: ${recommendation.recommended.name}`,
        `Reason: ${recommendation.reason}`,
        `Positioning: ${recommendation.positioning}`,
        `Keywords: ${recommendation.keywords.join(", ") || "Review JD manually"}`,
      ].join("\n"),
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <aside className="panel resumeAnalyzer">
      <div className="panelHeader">
        <strong>Role analyzer</strong>
        <span className="statusPill">Paste JD</span>
      </div>
      <label>
        Role title or JD snippet
        <textarea
          rows={8}
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
      </label>
      <button className="button primary" disabled={busy || !input.trim()} onClick={analyze} type="button">
        <SearchCheck size={16} /> {busy ? "Analyzing..." : "Recommend resume"}
      </button>

      {recommendation ? (
        <div className="resumeResult">
          <div className="leadSignal">
            <strong>{recommendation.recommended.name}</strong>
            <span>{recommendation.score}/5 match</span>
          </div>
          <div className="messageBox">{recommendation.reason}</div>
          <div className="messageBox">{recommendation.positioning}</div>

          <div>
            <strong>Keywords to emphasize</strong>
            <div className="chipList resumeChips">
              {recommendation.keywords.length ? (
                recommendation.keywords.map((keyword) => (
                  <span className="tag teal" key={keyword}>
                    {keyword}
                  </span>
                ))
              ) : (
                <span className="tag amber">Manual review</span>
              )}
            </div>
          </div>

          {recommendation.cautions.length ? (
            <div>
              <strong>Cautions</strong>
              <ul className="compactList">
                {recommendation.cautions.map((caution) => (
                  <li key={caution}>{caution}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <button className="button secondary" onClick={copyPositioning} type="button">
            <Clipboard size={16} /> {copied ? "Copied" : "Copy positioning"}
          </button>
        </div>
      ) : null}
    </aside>
  );
}
