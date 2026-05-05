import { NextResponse } from "next/server";
import { recommendResumeAsync, resumeStudioSummaryAsync } from "../../../lib/resume-studio";

export async function GET() {
  return NextResponse.json(await resumeStudioSummaryAsync());
}

export async function POST(request: Request) {
  const body = (await request.json()) as { input?: string };
  const input = String(body.input || "").trim();
  if (!input) {
    return NextResponse.json({ error: "Role or JD text is required" }, { status: 400 });
  }

  return NextResponse.json({ recommendation: await recommendResumeAsync(input) });
}
