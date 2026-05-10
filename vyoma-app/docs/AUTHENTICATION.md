# Vyoma Authentication

Vyoma now uses Clerk for managed authentication. Clerk handles sign-in, sign-up, session UI, and route protection while the app keeps its existing `users`, `profiles`, tracker, leads, daily task, and memory ownership model.

## Current Implementation

- `proxy.ts` uses `clerkMiddleware()` to protect app routes and APIs.
- `app/layout.tsx` wraps the app in `<ClerkProvider>`.
- `app/components.tsx` and `app/login/page.tsx` use Clerk `<Show>`, `<SignInButton>`, `<SignUpButton>`, and `<UserButton>`.
- `lib/auth.ts` reads the signed-in Clerk session with `await auth()` and maps Clerk identity into the existing user/profile lookup.
- `lib/profile.ts` continues mapping the signed-in user to the active career profile.

## Required Environment Variables

Set these locally and in Vercel:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

Keep these existing production variables:

```text
NEXT_PUBLIC_APP_URL=...
VYOMA_STORAGE_MODE=postgres
DATABASE_URL=...
INTEGRATION_ENCRYPTION_KEY=...
OPENAI_API_KEY=...
```

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

The Clerk account maps to a local `users` row. The local user owns the profile, and the profile owns tracker rows, leads, resume variants, memory, and daily tasks.

## Integration Storage Boundary

`lib/integrations.ts` defines the OAuth account repository boundary. Local token storage is disabled. Production OAuth metadata and encrypted tokens go into `integration_accounts`.

Set `INTEGRATION_ENCRYPTION_KEY` before storing real provider tokens. If it is absent, the app falls back to `AUTH_SECRET`, but production should use a separate integration encryption key.

## Privacy Rules

- Do not store LinkedIn passwords.
- Do not expose resumes, tracker rows, assistant memory, or visa/work authorization notes across accounts.
- Encrypt OAuth tokens before storage.
- Keep AI prompts scoped to the signed-in user's profile and data.
