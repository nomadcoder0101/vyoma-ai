import { NextResponse } from "next/server";
import { loadProfileAsync } from "../../../../lib/profile";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const index = Number(url.searchParams.get("index"));

  if (!Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "Select a resume to download." }, { status: 400 });
  }

  const profile = await loadProfileAsync();
  const resume = profile.resumeTemplates[index];

  if (!resume?.fileUrl && !resume?.fullText) {
    return NextResponse.json({ error: "No attached resume file was found." }, { status: 404 });
  }

  if (resume.fileUrl) {
    const upstream = await fetch(resume.fileUrl);
    if (upstream.ok && upstream.body) {
      const fileName = sanitizeDownloadName(resume.fileName || resume.name || `resume-${index + 1}`);
      const contentType = resume.contentType || upstream.headers.get("content-type") || "application/octet-stream";

      return new NextResponse(upstream.body, {
        headers: {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Type": contentType,
        },
      });
    }
  }

  const fileName = sanitizeDownloadName(`${resume.name || `resume-${index + 1}`}.txt`);
  const body = [
    resume.name,
    resume.focus,
    "",
    resume.userComment ? `Comment: ${resume.userComment}` : "",
    "",
    resume.fullText || "No extracted resume text is available.",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function sanitizeDownloadName(value: string) {
  const cleaned = value.replace(/["\\\r\n]/g, "").trim();
  return cleaned || "resume";
}
