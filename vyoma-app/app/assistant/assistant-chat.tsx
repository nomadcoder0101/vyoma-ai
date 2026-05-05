"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import type { AssistantMemory, AssistantMessage } from "../../lib/assistant";

export function AssistantChat({ starterPrompts }: { starterPrompts: string[] }) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "I am ready. Ask me for today's job-search plan, sponsorship wording, Singapore positioning, resume selection, or outreach strategy.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"openai" | "local">("local");
  const [memoryCount, setMemoryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function loadMemory() {
      const response = await fetch("/api/assistant");
      if (!response.ok) return;
      const body = (await response.json()) as { memory: AssistantMemory };
      if (!mounted) return;
      setMessages(body.memory.messages);
      setMemoryCount(body.memory.learnings.length);
    }
    loadMemory();
    return () => {
      mounted = false;
    };
  }, []);

  async function sendMessage(messageText = input) {
    const trimmed = messageText.trim();
    if (!trimmed || busy) return;

    const nextMessages: AssistantMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: messages }),
      });

      if (!response.ok) {
        throw new Error("Assistant request failed");
      }

      const body = (await response.json()) as {
        mode: "openai" | "local";
        content: string;
        memory?: AssistantMemory;
      };
      setMode(body.mode);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: body.content },
      ]);
      setMemoryCount(body.memory?.learnings.length || memoryCount);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I could not reach the assistant service. Check that the dev server is running, then try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel assistantPanel">
      <div className="panelHeader">
        <strong>Chat with Vyoma AI</strong>
        <span className="statusPill">
          {mode === "openai" ? "OpenAI" : "Local fallback"} | {memoryCount} memories
        </span>
      </div>

      <div className="starterPrompts">
        {starterPrompts.map((prompt) => (
          <button
            className="button secondary"
            disabled={busy}
            key={prompt}
            onClick={() => sendMessage(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="chatTranscript" aria-live="polite">
        {messages.map((message, index) => (
          <div className={`chatBubble ${message.role}`} key={`${message.role}-${index}`}>
            <span>{message.role === "assistant" ? "Vyoma AI" : "You"}</span>
            <p>{message.content}</p>
          </div>
        ))}
        {busy ? (
          <div className="chatBubble assistant">
            <span>Vyoma AI</span>
            <p>Thinking...</p>
          </div>
        ) : null}
      </div>

      <div className="chatComposer">
        <textarea
          aria-label="Message"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask for strategy, wording, daily priorities, resume choice, or lead follow-up..."
          rows={3}
          value={input}
        />
        <button
          className="button primary"
          disabled={busy || !input.trim()}
          onClick={() => sendMessage()}
          type="button"
        >
          <Send size={16} /> Send
        </button>
      </div>
    </div>
  );
}
