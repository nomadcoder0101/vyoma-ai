import { NextResponse } from "next/server";
import {
  applyAgentInstruction,
  loadProfile,
  saveProfile,
  type CareerProfile,
} from "../../../lib/profile";

export async function GET() {
  return NextResponse.json({ profile: loadProfile() });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.action === "agent_edit") {
    const current = loadProfile();
    const profile = applyAgentInstruction(current, String(body.instruction || ""));
    return NextResponse.json({ profile: saveProfile(profile) });
  }

  const profileInput = body as CareerProfile;
  if (!profileInput.candidateName || !profileInput.headline) {
    return NextResponse.json(
      { error: "Candidate name and headline are required" },
      { status: 400 },
    );
  }

  return NextResponse.json({ profile: saveProfile(profileInput) });
}
