# Vyoma AI Remaining Items

Current baseline: Vercel deployment, Clerk auth, Neon Postgres, OpenAI assistant mode, user-scoped profile/tracker/leads/daily tasks/memory, resume upload, resume parsing, and local signed-in E2E smoke tests are in place.

## Fixed Now

- Direct resume upload endpoint added at `/api/resume/upload`.
- Profile Setup can upload PDF/DOC/DOCX files, store returned file URLs, full extracted text, parsed role signals, and user comments.
- Resume Studio shows attached file links, parsed summaries, comments, and protected download links.
- Resume upload is limited to PDF/DOC/DOCX and 5 MB per file.
- Local Playwright signed-in smoke test added through a gated `E2E_TEST_MODE` test session.
- Settings and roadmap now reflect current auth, AI, database, integration, and resume states.

## Remaining Items

| Priority | Item | Status | Blocker / Requirement |
| --- | --- | --- | --- |
| P0 | Resume blob storage token | Ready when env is set | `BLOB_READ_WRITE_TOKEN` must be present locally and in Vercel for uploads. |
| P0 | Official LinkedIn OAuth | External blocker | Needs LinkedIn app credentials and approved scopes. Do not ask for LinkedIn passwords. |
| P1 | Resume parser quality | Iteration | PDF/DOCX parsing is implemented. Legacy DOC files upload, but convert to PDF/DOCX for reliable extraction. |
| P1 | Account/profile model | Decided for now | One account creates one profile. Admin support can manage Samruddhi's profile first, then evolve for SaaS later. |
| P1 | Admin/user management | Pending | Add simple admin ownership/management UI only after the Samruddhi-first workflow is stable. |
| P2 | Browser E2E suite | Started | Local signed-in smoke exists. Add flows for upload, onboarding save, lead conversion, daily task completion, and assistant memory. |
| P2 | Preview environment policy | Pending | Decide whether Vercel preview should use isolated DB/storage or production-like data. |

## Intentionally Out Of Scope

- LinkedIn password collection
- Unofficial LinkedIn scraping
- Storing raw OAuth tokens without encryption
- Claiming the app applied to jobs or sent messages unless the user did it
