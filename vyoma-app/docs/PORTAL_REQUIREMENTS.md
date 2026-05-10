# Vyoma AI Career Portal Requirements

## Product Goal

Vyoma AI should act as a real-time job search copilot. It should help a user build a strong career profile, confirm positioning, run daily searches, evaluate leads, track applications, draft outreach, remember what has already happened, and suggest what to improve next.

## Core User Journey

1. Public landing page explains what the portal does.
2. User creates an account and logs in.
3. User completes profile onboarding based on the Career Ops repository inputs.
4. User provides resume variants, profile descriptions, job-change context, location preferences, work authorization, and target roles.
5. AI creates a structured profile and asks the user to confirm it.
6. User can edit the profile through an agent-style assistant interface.
7. Confirmed profile powers a personalized dashboard, daily plan, lead queue, tracker, recommendations, and outreach drafts.
8. The portal keeps profile memory: what was applied to, what worked, what was ignored, what needs improvement, and what the user should do next.

## Current Scope

The product is designed as a general job-search workspace for any role, industry, location preference, career change, relocation, or remote search.

The first seeded profile is Samruddhi Chougule, AML/KYC and Financial Crime Compliance, based in Kuala Lumpur, targeting Malaysia, Singapore, and remote APAC roles. That profile-specific context should stay inside signed-in app areas and assistant memory, not on the generic public landing page.

Production authentication is active through Clerk. User-scoped data is stored in Postgres when `VYOMA_STORAGE_MODE=postgres`.

## Data Needed Per Profile

- Personal and contact-safe profile basics
- Current location and relocation context
- Work authorization and sponsorship needs
- Target countries, cities, and remote markets
- Target role families
- Salary expectations
- Resume versions and which role type each version supports
- Profile summary, reason for job change, strengths, constraints, and positioning notes
- Existing application tracker history
- Lead queue history
- Outreach history
- Agent memory and improvement suggestions

## AI Capabilities

- Generate and refine the master profile
- Compare job leads to the profile
- Score role fit
- Draft recruiter outreach
- Draft follow-up messages
- Suggest daily actions
- Detect gaps in search strategy
- Learn from application outcomes and user decisions

## Safety Rules

- Do not ask for or store LinkedIn passwords.
- Use official OAuth or manual user-provided links.
- Human approval is required before sending outreach, submitting applications, or transmitting sensitive data.
- The AI recommends and drafts; the user decides what gets sent.

## Build Phases

### Phase 1: Pilot Portal

- Landing page
- Managed login and signup
- Profile onboarding and confirmation
- Personalized dashboard
- Tracker, daily plan, lead queue
- Local memory suggestions

### Phase 2: Real App Foundation

- Production auth through Clerk
- Database storage per user/profile
- Resume upload through blob storage, then parsing
- OpenAI assistant/API integration
- LinkedIn official OAuth where supported
- Deployment on Vercel under app.vyomaai.in

### Phase 3: Agentic Search

- Scheduled daily search suggestions
- User-approved lead imports
- Follow-up reminders
- Outcome learning
- Role-specific resume and outreach generation
