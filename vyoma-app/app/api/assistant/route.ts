import { NextResponse } from "next/server";
import {
  answerWithAssistant,
  loadAssistantMemoryAsync,
  rememberAssistantExchangeAsync,
  type AssistantMessage,
} from "../../../lib/assistant";

export async function GET() {
  return NextResponse.json({ memory: await loadAssistantMemoryAsync() });
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
  const memory = await rememberAssistantExchangeAsync(message, result.content, result.mode);
  return NextResponse.json({ ...result, memory });
}
