import { NextResponse } from "next/server";
import { checkDatabaseHealth, loadDatabaseStatus } from "../../../lib/database";

export async function GET() {
  const status = loadDatabaseStatus();
  const health = await checkDatabaseHealth();

  return NextResponse.json({
    status,
    health,
  });
}
