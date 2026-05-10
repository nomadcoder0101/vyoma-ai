import { auth, clerkClient } from "@clerk/nextjs/server";

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
  const clerkUser = await loadClerkUser(session.userId);
  const email = normalizeEmail(
    claims.email ||
      claims.primary_email_address ||
      claims.email_address ||
      clerkUser.email ||
      `${session.userId}@clerk.local`,
  );
  const name = sanitizeName(
    claims.name ||
      claims.full_name ||
      [claims.first_name, claims.last_name].filter(Boolean).join(" ") ||
      clerkUser.name,
  );

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

async function loadClerkUser(userId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primaryEmail =
      user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId) ||
      user.emailAddresses[0];
    return {
      email: primaryEmail?.emailAddress || "",
      name: sanitizeName(user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ")),
    };
  } catch {
    return { email: "", name: "" };
  }
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
