import { NextResponse } from "next/server";
import { importLeadFromTextAsync, parseLeadText } from "../../../../lib/lead-import";

export async function POST(request: Request) {
  const body = await request.json();
  const rawText = String(body.rawText || "").trim();
  const mode = String(body.mode || "import");

  if (!rawText) {
    return NextResponse.json({ error: "Job text is required" }, { status: 400 });
  }

  if (mode === "preview") {
    return NextResponse.json({ preview: parseLeadText(rawText) });
  }

  return NextResponse.json(await importLeadFromTextAsync(rawText), { status: 201 });
}
