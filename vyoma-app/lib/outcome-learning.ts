import { loadAssistantMemory, saveAssistantMemory } from "./assistant";
import type { Application, PipelineStatus } from "./tracker";

type LearningType = "conversation" | "decision" | "risk" | "next_action";

export function recordOutcomeLearning(application: Application, status: PipelineStatus, note: string) {
  const learning = buildLearning(application, status, note);
  if (!learning) return null;

  const memory = loadAssistantMemory();
  saveAssistantMemory({
    ...memory,
    learnings: [learning, ...memory.learnings].slice(0, 40),
    updatedAt: new Date().toISOString(),
  });

  return learning;
}

function buildLearning(application: Application, status: PipelineStatus, note: string) {
  const createdAt = new Date().toISOString();
  const base = `${application.company} | ${application.role} | ${application.bucket}`;
  const cleanNote = note.trim();

  if (status === "interview") {
    return {
      id: `outcome-${Date.now()}`,
      type: "decision" as const,
      text: `Interview signal: ${base}. This role family and company type should be prioritized. ${cleanNote ? `Note: ${cleanNote}` : ""}`.trim(),
      createdAt,
    };
  }

  if (status === "offer") {
    return {
      id: `outcome-${Date.now()}`,
      type: "decision" as const,
      text: `Offer signal: ${base}. Treat this as a high-confidence profile-market fit pattern. ${cleanNote ? `Note: ${cleanNote}` : ""}`.trim(),
      createdAt,
    };
  }

  if (status === "rejected") {
    return {
      id: `outcome-${Date.now()}`,
      type: "risk" as const,
      text: `Rejection signal: ${base}. Review whether fit, sponsorship, timing, or positioning needs adjustment. ${cleanNote ? `Note: ${cleanNote}` : ""}`.trim(),
      createdAt,
    };
  }

  if (status === "follow_up_sent") {
    return {
      id: `outcome-${Date.now()}`,
      type: "next_action" as const,
      text: `Follow-up sent: ${base}. Watch for response and avoid duplicate outreach too soon. ${cleanNote ? `Note: ${cleanNote}` : ""}`.trim(),
      createdAt,
    };
  }

  if (status === "closed") {
    return {
      id: `outcome-${Date.now()}`,
      type: "conversation" as const,
      text: `Closed application: ${base}. Keep closed opportunities out of daily follow-up focus. ${cleanNote ? `Note: ${cleanNote}` : ""}`.trim(),
      createdAt,
    };
  }

  return null;
}
