import { NextResponse } from "next/server";
import {
  addLead,
  convertLeadToTracker,
  loadLeads,
  updateLead,
  type LeadType,
} from "../../../lib/leads";

const leadTypes = new Set(["job", "recruiter", "company"]);

export async function GET() {
  return NextResponse.json({ leads: loadLeads() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const action = String(body.action || "");

  if (action) {
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ error: "Lead id is required" }, { status: 400 });
    }
    if (!["evaluate", "draft", "resume", "contacted", "archive", "restore", "convert"].includes(action)) {
      return NextResponse.json({ error: "Invalid lead action" }, { status: 400 });
    }

    if (action === "convert") {
      const result = convertLeadToTracker(id);
      if (!result) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      return NextResponse.json(result);
    }

    const lead = updateLead(
      id,
      action as "evaluate" | "draft" | "resume" | "contacted" | "archive" | "restore",
    );
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ lead });
  }

  const type = String(body.type || "");
  const url = String(body.url || "").trim();

  if (!leadTypes.has(type)) {
    return NextResponse.json({ error: "Invalid lead type" }, { status: 400 });
  }

  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json(
      { error: "Lead URL must start with http:// or https://" },
      { status: 400 },
    );
  }

  const lead = addLead({
    type: type as LeadType,
    url,
    title: String(body.title || ""),
    company: String(body.company || ""),
    notes: String(body.notes || ""),
  });

  return NextResponse.json({ lead }, { status: 201 });
}
