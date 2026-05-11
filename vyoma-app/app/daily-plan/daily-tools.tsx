"use client";

import { useMemo, useState } from "react";
import { ExternalLink, MessageSquareText, Plus, Sparkles } from "lucide-react";

type SearchShortcut = {
  title: string;
  detail: string;
  url: string;
};

export function SearchShortcutBoard({ initialSearches }: { initialSearches: SearchShortcut[] }) {
  const [searches, setSearches] = useState(initialSearches);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  function addShortcut() {
    if (!title.trim() || !/^https?:\/\//.test(url.trim())) return;
    setSearches((current) => [
      ...current,
      { title: title.trim(), detail: "Custom search shortcut for this session.", url: url.trim() },
    ]);
    setTitle("");
    setUrl("");
  }

  return (
    <div className="shortcutBoard">
      <div className="shortcutList">
        {searches.map((item) => (
          <a className="searchItem" href={item.url} key={`${item.title}-${item.url}`} target="_blank" rel="noreferrer">
            <span>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </span>
            <ExternalLink size={18} />
          </a>
        ))}
      </div>
      <div className="shortcutCreator">
        <strong>Add a search you use often</strong>
        <input placeholder="Shortcut name" value={title} onChange={(event) => setTitle(event.target.value)} />
        <input placeholder="https://..." value={url} onChange={(event) => setUrl(event.target.value)} />
        <button className="button secondary" onClick={addShortcut} type="button">
          <Plus size={16} /> Add shortcut
        </button>
      </div>
    </div>
  );
}

export function OutreachCoach({ baseMessage }: { baseMessage: string }) {
  const [context, setContext] = useState("");
  const draft = useMemo(() => {
    const trimmed = context.trim();
    if (!trimmed) return baseMessage;
    return `${baseMessage}\n\nContext to personalize: ${trimmed}\n\nSuggested tweak: lead with the strongest fit, keep the message short, and ask for the right contact or next step.`;
  }, [baseMessage, context]);

  return (
    <div className="outreachCoach panel">
      <div className="panelHeader">
        <strong>Outreach helper</strong>
        <span className="statusPill">Draft calmly</span>
      </div>
      <div className="agentSuggestion">
        <Sparkles size={18} />
        <span>Add the company, role, or concern. The helper keeps a reusable draft ready without forcing you to start from zero.</span>
      </div>
      <textarea
        aria-label="Outreach context"
        placeholder="Example: follow up with recruiter at OCBC for compliance testing role, keep sponsorship wording light."
        rows={3}
        value={context}
        onChange={(event) => setContext(event.target.value)}
      />
      <div className="messageBlock">
        <div className="messageBlockHeader">
          <strong>Reusable draft</strong>
          <MessageSquareText size={16} />
        </div>
        <div className="messageBox">{draft}</div>
      </div>
    </div>
  );
}
