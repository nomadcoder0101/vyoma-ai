"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import type { DailyCommand } from "../../lib/daily-command";

export function DailyCommandBoard({ initialCommand }: { initialCommand: DailyCommand }) {
  const [command, setCommand] = useState(initialCommand);
  const [busyId, setBusyId] = useState("");
  const completed = command.actions.filter((action) => action.done).length;

  async function toggleAction(id: string, done: boolean) {
    setBusyId(id);
    const response = await fetch("/api/daily-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done }),
    });
    setBusyId("");
    if (!response.ok) return;
    const body = (await response.json()) as { command: DailyCommand };
    setCommand(body.command);
  }

  return (
    <div className="panel">
      <div className="panelHeader">
        <strong>Today&apos;s command center</strong>
        <span className="statusPill">
          {completed}/{command.actions.length} done
        </span>
      </div>
      <div className="dailyProgress">
        <span style={{ width: `${command.actions.length ? (completed / command.actions.length) * 100 : 0}%` }} />
      </div>
      <div className="dailyActionList">
        {command.actions.map((action) => (
          <article className={`dailyAction ${action.done ? "done" : ""}`} key={action.id}>
            <button
              aria-label={action.done ? "Mark not done" : "Mark done"}
              className="dailyCheck"
              disabled={busyId === action.id}
              onClick={() => toggleAction(action.id, !action.done)}
              type="button"
            >
              {action.done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
            </button>
            <div>
              <div className="dailyActionTop">
                <strong>{action.title}</strong>
                <span className={`tag ${action.priority === "high" ? "red" : action.priority === "medium" ? "amber" : "teal"}`}>
                  {action.priority}
                </span>
              </div>
              <p>{action.detail}</p>
              <Link className="inlineLink" href={action.href}>
                Open workspace <ExternalLink size={14} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
