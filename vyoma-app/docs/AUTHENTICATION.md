# Vyoma Authentication Plan

This app is currently in local pilot mode. The login page marks the account boundary, but it does not yet create real sessions.

## Recommendation

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

## Clerk Implementation Path

1. Install Clerk packages.
2. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
3. Add `middleware.ts` to protect app routes and APIs.
4. Replace the pilot login card with Clerk sign-in/sign-up controls.
5. Create or fetch the user's first `profiles` row after sign-in.
6. Import Samruddhi's current local data under that user.
7. Remove file writes from production code paths.

## Integration Storage Boundary

`lib/integrations.ts` defines the OAuth account repository boundary. Local token storage is disabled. Production OAuth metadata should go into `integration_accounts` only after token encryption and user ownership are implemented.

## Privacy Rules

- Do not store LinkedIn passwords.
- Do not expose resumes, tracker rows, assistant memory, or visa/work authorization notes across accounts.
- Encrypt OAuth tokens before storage.
- Keep AI prompts scoped to the signed-in user's profile and data.
