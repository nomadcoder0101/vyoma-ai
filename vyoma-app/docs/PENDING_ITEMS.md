# Vyoma AI Pending Items

This list reflects the current live app state after Postgres storage, Clerk auth wiring, route protection, and Vercel deployment.

## Completed In This Pass

- Added this pending-items backlog so product gaps are tracked in one place.
- Updated stale authentication, deployment, storage, and roadmap documentation.
- Updated in-app roadmap/status wording to match the deployed app.
- Added encrypted Postgres storage support for OAuth integration tokens.
- Added `npm.cmd run smoke:live` for production auth/route smoke checks.
- Wired Clerk into the App Router shell, login page, route middleware, and local auth identity adapter.
- Kept credential-bearing LinkedIn access out of scope until official OAuth and encryption are implemented.

## Remaining Product Items

| Priority | Item | Status | Blocker / Requirement |
| --- | --- | --- | --- |
| P0 | Managed authentication provider | In progress | Clerk is wired in code. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` locally and in Vercel. |
| P0 | Encrypted OAuth token storage | Done | AES-GCM encrypted Postgres token storage is implemented; set `INTEGRATION_ENCRYPTION_KEY` separately before storing real provider tokens. |
| P0 | Official LinkedIn OAuth | Blocked | Needs LinkedIn app credentials and approved OAuth scopes. Do not ask for LinkedIn passwords. |
| P1 | Resume/document upload storage | Pending | Needs storage provider, file size limits, virus/privacy policy, and user-scoped access rules. |
| P1 | OpenAI production assistant key | Done | `OPENAI_API_KEY` is configured and the live assistant reports OpenAI mode. |
| P1 | Multi-profile account model | Pending | Current app maps one active career profile per signed-in account. |
| P1 | Admin/user management UI | Pending | Best handled after managed auth provider is chosen. |
| P2 | Preview environment storage mode | Pending | Vercel preview variables are branch-scoped; production and development are configured. |
| P2 | Production smoke test | In progress | `npm.cmd run smoke:live` checks public pages and anonymous route blocking. Signed-in API smoke should be re-added through Clerk test auth after Clerk keys are configured. |
| P2 | End-to-end browser test suite | Pending | Add Playwright flows for tracker actions, lead conversion, daily completion, and assistant memory. |
| P2 | GitHub/Vercel source alignment | Done | Deployed code is committed and pushed so production is reproducible from the repository. |

## Current Production Baseline

- Domain: `https://vyoma-ai.vercel.app`, `https://vyomaai.in`, `https://www.vyomaai.in`
- Storage: Neon Postgres via `VYOMA_STORAGE_MODE=postgres`
- Protected areas: dashboard, onboarding, tracker, daily plan, leads, resume, assistant, memory, settings, and APIs
- Public areas: landing page, login page, roadmap
- Database-backed areas: profile, tracker, leads, daily tasks, assistant memory
- Intentionally blocked: LinkedIn credential collection, unofficial scraping, and unapproved OAuth scopes
