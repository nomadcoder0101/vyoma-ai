import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const sessionCookieName = "vyoma_session";

export type AuthUser = {
  email: string;
  name: string;
};

const defaultPilotUser: AuthUser = {
  email: "samruddhi-pilot@vyoma.local",
  name: "Samruddhi Chougule",
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(sessionCookieName)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUserOrPilot(): Promise<AuthUser> {
  return (await getCurrentUser()) || defaultPilotUser;
}

export function createSessionToken(user: AuthUser) {
  const payload = Buffer.from(
    JSON.stringify({
      email: normalizeEmail(user.email),
      name: sanitizeName(user.name) || normalizeEmail(user.email),
      issuedAt: new Date().toISOString(),
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): AuthUser | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  if (!safeEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<AuthUser>;
    const email = normalizeEmail(parsed.email || "");
    if (!email) return null;
    return {
      email,
      name: sanitizeName(parsed.name || "") || email,
    };
  } catch {
    return null;
  }
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function sanitizeName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || "vyoma-local-development-secret";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
