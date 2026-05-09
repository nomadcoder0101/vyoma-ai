import { NextResponse } from "next/server";
import { loadDailyCommandAsync, updateDailyActionAsync } from "../../../lib/daily-command";

export async function GET() {
  return NextResponse.json({ command: await loadDailyCommandAsync() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const id = String(body.id || "");
  const done = Boolean(body.done);

  if (!id) {
    return NextResponse.json({ error: "Action id is required" }, { status: 400 });
  }

  return NextResponse.json({ command: await updateDailyActionAsync(id, done) });
}
