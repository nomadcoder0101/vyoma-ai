# Vyoma AI Remaining Items

Current baseline: Vercel deployment, Clerk auth, Neon Postgres, OpenAI assistant mode, user-scoped profile/tracker/leads/daily tasks/memory, resume metadata, and code-level resume upload support are in place.

## Fixed Now

- Direct resume upload endpoint added at `/api/resume/upload`.
- Profile Setup can upload PDF/DOC/DOCX files, store returned file URLs, and show attached file links.
- Resume Studio shows attached file links.
- Resume upload is limited to PDF/DOC/DOCX and 5 MB per file.
- Settings and roadmap now reflect current auth, AI, database, integration, and resume states.

## Remaining Items

| Priority | Item | Status | Blocker / Requirement |
| --- | --- | --- | --- |
| P0 | Resume blob storage token | Environment gated | Add `BLOB_READ_WRITE_TOKEN` in Vercel and local `.env.local` to activate direct file uploads. |
| P0 | Official LinkedIn OAuth | External blocker | Needs LinkedIn app credentials and approved scopes. Do not ask for LinkedIn passwords. |
| P1 | Signed-in smoke test | Pending | Needs Clerk test-session strategy or test user automation that does not expose credentials. |
| P1 | Resume parsing | Pending | After upload works, parse PDF/DOCX into structured profile/resume signals. |
| P1 | Multi-profile accounts | Pending | Current app supports one active career profile per signed-in user. |
| P1 | Admin/user management | Pending | Needs product decision on whether Vyoma is single-user, family/team, or public SaaS. |
| P2 | Browser E2E suite | Pending | Add Playwright flows for onboarding, lead conversion, daily task completion, and assistant memory. |
| P2 | Preview environment policy | Pending | Decide whether Vercel preview should use isolated DB/storage or production-like data. |

## Intentionally Out Of Scope

- LinkedIn password collection
- Unofficial LinkedIn scraping
- Storing raw OAuth tokens without encryption
- Claiming the app applied to jobs or sent messages unless the user did it
