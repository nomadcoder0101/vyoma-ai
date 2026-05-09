import { NextResponse } from "next/server";
import {
  createSessionToken,
  normalizeEmail,
  sanitizeName,
  sessionCookieName,
} from "../../../../lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = normalizeEmail(String(formData.get("email") || ""));
  const name = sanitizeName(String(formData.get("name") || ""));
  const next = safeNextPath(String(formData.get("next") || "/dashboard"));

  if (!email || !email.includes("@")) {
    return NextResponse.redirect(new URL(`/login?error=email&next=${encodeURIComponent(next)}`, request.url));
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set(sessionCookieName, createSessionToken({ email, name: name || email }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

function safeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value.startsWith("/api/")) return "/dashboard";
  return value;
}
