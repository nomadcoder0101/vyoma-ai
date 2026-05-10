import { auth } from "@clerk/nextjs/server";

export type AuthUser = {
  email: string;
  name: string;
  providerUserId?: string;
};

const defaultPilotUser: AuthUser = {
  email: "samruddhi-pilot@vyoma.local",
  name: "Samruddhi Chougule",
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session.userId) return null;

  const claims = session.sessionClaims as ClerkSessionClaims;
  const email = normalizeEmail(
    claims.email ||
      claims.primary_email_address ||
      claims.email_address ||
      `${session.userId}@clerk.local`,
  );
  const name = sanitizeName(claims.name || claims.full_name || [claims.first_name, claims.last_name].filter(Boolean).join(" "));

  return {
    email,
    name: name || email,
    providerUserId: session.userId,
  };
}

export async function getCurrentUserOrPilot(): Promise<AuthUser> {
  return (await getCurrentUser()) || defaultPilotUser;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function sanitizeName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

type ClerkSessionClaims = {
  email?: string;
  primary_email_address?: string;
  email_address?: string;
  name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
};
