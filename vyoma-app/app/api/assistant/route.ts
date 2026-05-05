import { NextResponse } from "next/server";
import {
  answerWithAssistant,
  loadAssistantMemory,
  rememberAssistantExchange,
  type AssistantMessage,
} from "../../../lib/assistant";

export async function GET() {
  return NextResponse.json({ memory: loadAssistantMemory() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: string;
    history?: AssistantMessage[];
  };
  const message = String(body.message || "").trim();

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const result = await answerWithAssistant(message, body.history || []);
  const memory = rememberAssistantExchange(message, result.content, result.mode);
  return NextResponse.json({ ...result, memory });
}
