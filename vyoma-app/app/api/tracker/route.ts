import { NextResponse } from "next/server";
import { recordOutcomeLearning } from "../../../lib/outcome-learning";
import {
  loadApplications,
  updateApplicationAction,
  type PipelineStatus,
} from "../../../lib/tracker";

const statuses = new Set([
  "applied",
  "follow_up_sent",
  "interview",
  "rejected",
  "offer",
  "closed",
]);

export async function GET() {
  return NextResponse.json({ applications: loadApplications() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const num = Number(body.num);
  const pipelineStatus = String(body.pipelineStatus || "");

  if (!Number.isFinite(num)) {
    return NextResponse.json({ error: "Application number is required" }, { status: 400 });
  }
  if (!statuses.has(pipelineStatus)) {
    return NextResponse.json({ error: "Invalid pipeline status" }, { status: 400 });
  }

  const application = updateApplicationAction({
    num,
    pipelineStatus: pipelineStatus as PipelineStatus,
    note: String(body.note || ""),
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const learning = recordOutcomeLearning(
    application,
    pipelineStatus as PipelineStatus,
    String(body.note || ""),
  );

  return NextResponse.json({ application, learning });
}
