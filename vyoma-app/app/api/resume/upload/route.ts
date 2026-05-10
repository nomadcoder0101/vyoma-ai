import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { parseResumeFile } from "../../../../lib/resume-parser";

const allowedTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const maxBytes = 5 * 1024 * 1024;

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Resume file upload needs BLOB_READ_WRITE_TOKEN in the environment." },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a PDF, DOC, or DOCX resume file." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Only PDF, DOC, and DOCX resume files are allowed." }, { status: 400 });
  }

  if (file.size > maxBytes) {
    return NextResponse.json({ error: "Resume file must be 5 MB or smaller." }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  const blob = await put(`resumes/${Date.now()}-${safeName || "resume"}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  const parsed = await parseResumeFile(file);

  return NextResponse.json({
    fileName: file.name,
    fileUrl: blob.url,
    size: file.size,
    contentType: file.type,
    fullText: parsed.fullText,
    parsedSummary: parsed.parsedSummary,
    uploadedAt: new Date().toISOString(),
  });
}
