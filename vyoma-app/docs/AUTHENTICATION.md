# Vyoma Authentication

The app currently has a first-party signed session boundary. The login page creates a signed HTTP-only session cookie, protected routes redirect anonymous users to `/login`, and protected APIs return `401` for anonymous requests.

This is suitable for the current pilot. For a broader public launch, replace the first-party session provider with Clerk or Auth.js so email ownership, passwordless login, social login, account recovery, and hosted account management are handled by a mature auth provider.

## Current Implementation

- `lib/auth.ts` signs and verifies session cookies.
- `proxy.ts` protects app routes and APIs.
- `app/api/auth/login/route.ts` creates sessions.
- `app/api/auth/logout/route.ts` clears sessions.
- `lib/profile.ts` maps the signed-in email to a `users` row and active profile.
- `AUTH_SECRET` must be set in local and Vercel environments.

## Managed Auth Recommendation

Use Clerk for the first production launch.

Why:

- Fastest route to secure login on Vercel
- Hosted account management
- Email and social login support
- Good Next.js middleware support
- Less custom security work while the product is still evolving

Auth.js is also viable if we want a more open-source, self-managed path. Supabase Auth is viable if Supabase becomes the chosen Postgres provider.

## Required Route Protection

Public routes:

- `/`
- `/login`
- `/roadmap`, optional while building

Protected routes:

- `/onboarding`
- `/dashboard`
- `/tracker`
- `/daily-plan`
- `/leads`
- `/resume`
- `/assistant`
- `/memory`
- `/settings`

Protected APIs:

- `/api/profile`
- `/api/profile/confirm`
- `/api/tracker`
- `/api/daily-command`
- `/api/leads`
- `/api/leads/import`
- `/api/resume`
- `/api/assistant`
- `/api/settings`

## Account Data Boundary

Every production record should be scoped to one of:

- `user_id`
- `profile_id`

The account owns the profile. The profile owns the tracker, leads, resume variants, memory, and daily tasks.

## Clerk Upgrade Path

1. Install Clerk packages.
2. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
3. Replace `proxy.ts` session checks with Clerk auth checks.
4. Replace the first-party login form with Clerk sign-in/sign-up controls.
5. Create or fetch the user's first `profiles` row after sign-in.
6. Map Clerk user id/email to the existing `users` table.
7. Keep the current profile/tracker/leads/memory repositories scoped by `user_id` and `profile_id`.

## Integration Storage Boundary

`lib/integrations.ts` defines the OAuth account repository boundary. Local token storage is disabled. Production OAuth metadata and encrypted tokens go into `integration_accounts`.

Set `INTEGRATION_ENCRYPTION_KEY` before storing real provider tokens. If it is absent, the app falls back to `AUTH_SECRET`, which is acceptable for pilot validation but not ideal for long-lived production token rotation.

## Privacy Rules

- Do not store LinkedIn passwords.
- Do not expose resumes, tracker rows, assistant memory, or visa/work authorization notes across accounts.
- Encrypt OAuth tokens before storage.
- Keep AI prompts scoped to the signed-in user's profile and data.
