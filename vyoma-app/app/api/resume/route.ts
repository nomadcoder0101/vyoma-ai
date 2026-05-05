import { NextResponse } from "next/server";
import { recommendResume, resumeStudioSummary } from "../../../lib/resume-studio";

export async function GET() {
  return NextResponse.json(resumeStudioSummary());
}

export async function POST(request: Request) {
  const body = (await request.json()) as { input?: string };
  const input = String(body.input || "").trim();
  if (!input) {
    return NextResponse.json({ error: "Role or JD text is required" }, { status: 400 });
  }

  return NextResponse.json({ recommendation: recommendResume(input) });
}
