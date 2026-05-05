import { NextResponse } from "next/server";
import { loadSettingsStatus } from "../../../lib/settings";

export async function GET() {
  return NextResponse.json(loadSettingsStatus());
}
