import { neon } from "@neondatabase/serverless";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
loadEnvFile(join(root, ".env.local"));

const email = normalizeEmail(process.argv[2] || process.env.DEMO_USER_EMAIL || "demo@vyomaai.in");
const name = process.env.DEMO_USER_NAME || "Maya Raman";
const externalId = "samruddhi-chougule";
const now = new Date();
const today = now.toISOString().slice(0, 10);
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL.");
  process.exit(1);
}

const sql = neon(databaseUrl);
const user = await upsertUser();
const profile = await upsertProfile(user.id);

await clearProfileData(profile.id);
await seedResumes(profile.id);
const applications = await seedApplications(profile.id);
await seedLeads(profile.id);
await seedAssistantMemory(profile.id);
await seedDailyCompletions(profile.id);

console.log(`Demo profile seeded for ${email}.`);
console.log(`Candidate: ${name}`);
console.log(`Applications: ${applications.length}`);
console.log("Use a Clerk account with the same email to view this dataset in the website.");

async function upsertUser() {
  const rows = await sql.query(
    `
      insert into users (email, name, auth_provider, auth_provider_user_id)
      values ($1, $2, 'demo-seed', null)
      on conflict (email) do update set
        name = excluded.name,
        updated_at = now()
      returning id
    `,
    [email, name],
  );
  return rows[0];
}

async function upsertProfile(userId) {
  const agentNotes = [
    note("strength", "Strong fit for operational risk, compliance testing, controls assurance, and stakeholder-facing governance roles."),
    note("risk", "Career pivot from audit/controls into broader risk transformation needs clear positioning in outreach."),
    note("next_step", "Prioritize roles with regional scope, hybrid work, and measurable controls improvement outcomes."),
    note("learning", "Lead evaluation should separate hands-on control testing roles from strategy-only roles."),
  ];

  const rows = await sql.query(
    `
      insert into profiles (
        user_id, external_id, candidate_name, headline, current_location,
        work_authorization, salary_expectation, target_locations, target_roles,
        core_skills, profile_description, reason_for_change, constraints,
        confirmed_at, memory, agent_notes
      )
      values (
        $1, $2, $3, $4, $5,
        $6, $7, $8::jsonb, $9::jsonb,
        $10::jsonb, $11, $12, $13::jsonb,
        now(), $14::jsonb, $15::jsonb
      )
      on conflict (user_id, external_id) where external_id is not null do update set
        candidate_name = excluded.candidate_name,
        headline = excluded.headline,
        current_location = excluded.current_location,
        work_authorization = excluded.work_authorization,
        salary_expectation = excluded.salary_expectation,
        target_locations = excluded.target_locations,
        target_roles = excluded.target_roles,
        core_skills = excluded.core_skills,
        profile_description = excluded.profile_description,
        reason_for_change = excluded.reason_for_change,
        constraints = excluded.constraints,
        confirmed_at = excluded.confirmed_at,
        memory = excluded.memory,
        agent_notes = excluded.agent_notes,
        updated_at = now()
      returning id
    `,
    [
      userId,
      externalId,
      name,
      "Senior Risk, Controls, and Compliance Operations professional with 11+ years of experience",
      "Kuala Lumpur, Malaysia",
      "Open to Malaysia and Singapore roles; available for employer-sponsored work authorization where required.",
      "Flexible for the right role; target MYR 12,000-16,000 per month or Singapore market equivalent.",
      JSON.stringify(["Kuala Lumpur, Malaysia", "Singapore", "Remote APAC", "Hybrid Malaysia", "Remote Australia"]),
      JSON.stringify([
        "Operational Risk Manager",
        "Compliance Testing Lead",
        "Internal Controls Manager",
        "Risk and Governance Specialist",
        "Third Party Risk Analyst",
        "Business Controls Advisory",
      ]),
      JSON.stringify([
        "Operational risk",
        "Control testing",
        "Compliance monitoring",
        "Audit remediation",
        "Risk assessment",
        "Policy governance",
        "Third-party risk",
        "Stakeholder reporting",
        "Process improvement",
        "Regulatory documentation",
      ]),
      "Maya is a senior risk and controls professional with 11+ years across banking, fintech, and shared-services environments. She is strongest in control testing, audit remediation, compliance monitoring, policy governance, and translating complex risk issues into practical operating improvements.",
      "Maya is looking for a regional role with broader ownership, stronger stakeholder influence, and a healthier operating rhythm after several years in high-volume controls remediation programs.",
      JSON.stringify([
        "Needs roles that value execution and advisory strength, not pure sales or business development.",
        "Should avoid jobs requiring local regulatory license unless employer can support it.",
        "Remote APAC roles are acceptable if time zones overlap with Malaysia.",
        "Prioritize employers with mature risk, compliance, banking, fintech, or consulting functions.",
      ]),
      JSON.stringify([
        "Demo profile is intentionally broad so every page has data to test.",
        "Use different resume versions for controls testing, operational risk, third-party risk, and governance roles.",
        "Lead queue includes all statuses so filters, archive, restore, copy, and conversion can be tested.",
        "Tracker includes applied, follow-up, interview, rejection, offer, and closed examples.",
      ]),
      JSON.stringify(agentNotes),
    ],
  );
  return rows[0];
}

async function clearProfileData(profileId) {
  await sql.query("delete from daily_tasks where profile_id = $1", [profileId]);
  await sql.query("delete from memories where profile_id = $1", [profileId]);
  await sql.query("delete from assistant_messages where profile_id = $1", [profileId]);
  await sql.query("delete from leads where profile_id = $1", [profileId]);
  await sql.query(
    "delete from application_events where application_id in (select id from applications where profile_id = $1)",
    [profileId],
  );
  await sql.query("delete from applications where profile_id = $1", [profileId]);
  await sql.query("delete from resume_variants where profile_id = $1", [profileId]);
}

async function seedResumes(profileId) {
  const resumes = [
    {
      name: "Operational Risk Manager",
      focus: "Operational risk, RCSA, incident management, controls improvement",
      roleSignals: ["Operational Risk", "Control Testing", "Governance"],
      comment: "Best for first-round applications where the job emphasizes risk ownership and stakeholder reporting.",
    },
    {
      name: "Compliance Testing Lead",
      focus: "Compliance monitoring, testing plans, regulatory issue tracking",
      roleSignals: ["Compliance Testing", "Regulatory Monitoring", "Audit Remediation"],
      comment: "Use when the JD asks for monitoring reviews, testing methodology, QA, or regulatory action closure.",
    },
    {
      name: "Third Party Risk",
      focus: "Vendor due diligence, outsourcing risk, control evidence review",
      roleSignals: ["Third Party Risk", "Due Diligence", "Vendor Controls"],
      comment: "Use for banks, fintechs, procurement risk, or outsourcing governance roles.",
    },
    {
      name: "Governance and Controls Advisory",
      focus: "Policy governance, process improvement, management reporting",
      roleSignals: ["Policy Governance", "Controls Advisory", "Process Improvement"],
      comment: "Best for consulting, transformation, and business controls advisory roles.",
    },
  ];

  for (const resume of resumes) {
    const fullText = [
      `${name} - ${resume.name}`,
      resume.focus,
      "Experience includes operational risk, compliance testing, internal controls, audit remediation, stakeholder reporting, issue validation, risk assessment, policy governance, and process improvement across banks and fintech environments.",
    ].join("\n");
    await sql.query(
      `
        insert into resume_variants (
          profile_id, name, focus, notes, file_url, file_name, file_size,
          content_type, full_text, parsed_summary, user_comment, uploaded_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, 'application/pdf', $8, $9::jsonb, $10, $11)
      `,
      [
        profileId,
        resume.name,
        resume.focus,
        `Demo resume variant. ${resume.comment}`,
        `https://example.com/demo-resumes/${slug(resume.name)}.pdf`,
        `${slug(resume.name)}.pdf`,
        245760,
        fullText,
        JSON.stringify({
          status: "parsed",
          extractedAt: now.toISOString(),
          wordCount: fullText.split(/\s+/).length,
          characterCount: fullText.length,
          detectedSections: ["Summary", "Experience", "Skills"],
          roleSignals: resume.roleSignals,
          skillSignals: ["Risk assessment", "Stakeholder management", "Regulatory awareness"],
          notes: ["Demo parsed summary seeded for end-to-end testing."],
        }),
        resume.comment,
        daysAgo(2),
      ],
    );
  }
}

async function seedApplications(profileId) {
  const apps = [
    app(1, 18, "Maybank", "Operational Risk Manager", "4.5", "applied", "Operational Risk", "High-fit local bank role; follow up with risk transformation angle."),
    app(2, 14, "DBS Singapore", "Compliance Testing AVP", "4.7", "follow_up_sent", "Compliance Testing", "Follow-up sent to recruiter; emphasize regional controls testing."),
    app(3, 8, "Wise", "Senior Controls Specialist", "4.2", "interview", "Controls Advisory", "Interview scheduled; prepare examples on issue closure and control redesign."),
    app(4, 31, "Standard Chartered", "Third Party Risk Specialist", "4.0", "rejected", "Third Party Risk", "Rejected after HR screen; likely local preference."),
    app(5, 5, "Grab", "Governance and Risk Lead", "4.8", "offer", "Governance", "Offer discussion pending; compare flexibility and sponsorship."),
    app(6, 46, "Big 4 Advisory", "Risk Advisory Manager", "3.7", "closed", "Consulting", "Closed after no response; keep consulting examples ready."),
    app(7, 2, "Airwallex", "Business Controls Partner", "4.1", "applied", "Business Controls", "Fresh application. Needs tailored outreach."),
    app(8, 22, "CIMB", "Compliance Monitoring Manager", "4.4", "applied", "Compliance Monitoring", "Strong Malaysia fit; follow-up overdue."),
  ];

  for (const item of apps) {
    const rows = await sql.query(
      `
        insert into applications (
          profile_id, source_row_number, applied_on, company, role, url, score, status, notes, role_bucket
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        returning id
      `,
      [
        profileId,
        item.num,
        daysAgo(item.daysAgo),
        item.company,
        item.role,
        `https://www.linkedin.com/jobs/view/demo-${item.num}`,
        item.score,
        item.status,
        item.notes,
        item.bucket,
      ],
    );
    if (item.status !== "applied") {
      await sql.query(
        "insert into application_events (application_id, event_type, pipeline_status, note, created_at) values ($1, $2, $3, $4, $5)",
        [
          rows[0].id,
          eventTypeForStatus(item.status),
          item.status,
          `Demo status event for ${item.status}. ${item.notes}`,
          daysAgo(Math.max(item.daysAgo - 1, 0)),
        ],
      );
    }
  }
  return apps;
}

async function seedLeads(profileId) {
  const leads = [
    lead("job", "new", "Operational Risk Lead - Digital Bank", "GXBank", 0, "Fresh high-fit lead for active filter testing."),
    lead("recruiter", "evaluated", "Regional Risk Recruiter", "Hays", 4.1, "Recruiter profile with Malaysia and Singapore risk mandates."),
    lead("company", "drafted", "Fintech Controls Hiring Team", "Ant International", 4.3, "Company lead with outreach draft ready."),
    lead("job", "contacted", "Compliance Testing Manager", "OCBC", 4.6, "Already contacted. Test contacted filter and next action."),
    lead("job", "archived", "Junior Risk Analyst", "Startup Demo", 2.1, "Archived because too junior; test archived filter and restore."),
    lead("company", "new", "Risk Transformation Team", "Accenture", 0, "Consulting lead to evaluate and convert if promising."),
  ];

  for (let index = 0; index < leads.length; index += 1) {
    const item = leads[index];
    await sql.query(
      `
        insert into leads (
          profile_id, type, url, title, company, notes, status, score,
          evaluation, next_action, outreach_draft, resume_recommendation, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14)
      `,
      [
        profileId,
        item.type,
        `https://www.linkedin.com/${item.type === "job" ? "jobs/view" : item.type === "recruiter" ? "in" : "company"}/demo-${slug(item.title)}`,
        item.title,
        item.company,
        item.notes,
        item.status,
        item.score || null,
        item.status === "new" ? null : `Score: ${item.score}/5. Demo evaluation: strong risk and controls alignment; verify sponsorship and scope.`,
        item.status === "archived"
          ? "Restore only if scope becomes more senior."
          : "Review fit, tailor resume, and decide whether to contact or convert.",
        ["drafted", "contacted"].includes(item.status)
          ? `Hi [Name], Maya Raman has 11+ years in operational risk, compliance testing, and controls remediation. She is exploring ${item.title} opportunities with ${item.company}. Would you be the right person to discuss this role?`
          : null,
        item.status === "new"
          ? null
          : JSON.stringify({
              recommended: {
                name: "Operational Risk Manager",
                focus: "Operational risk, RCSA, incident management, controls improvement",
                notes: "Seeded demo recommendation.",
              },
              score: item.score,
              reason: "Role language matches operational risk, compliance, and controls experience.",
              positioning: "Lead with control testing, issue remediation, and stakeholder reporting.",
              keywords: ["operational risk", "controls", "compliance testing"],
            }),
        daysAgo(index + 1),
        daysAgo(index),
      ],
    );
  }
}

async function seedAssistantMemory(profileId) {
  const messages = [
    ["user", "Which leads should Maya prioritize today?"],
    ["assistant", "Prioritize GXBank, OCBC, and Wise because they combine controls ownership, regional scope, and fintech/banking relevance."],
    ["user", "Make the outreach softer on sponsorship."],
    ["assistant", "Lead with risk and controls value first. Keep authorization as a factual closing line only when needed."],
  ];

  for (let index = 0; index < messages.length; index += 1) {
    const [role, content] = messages[index];
    await sql.query(
      "insert into assistant_messages (profile_id, role, content, mode, created_at) values ($1, $2, $3, 'local', $4)",
      [profileId, role, content, daysAgo(index)],
    );
  }

  const memories = [
    ["decision", "Maya prefers regional risk roles over narrow checklist testing roles.", "assistant"],
    ["risk", "Sponsorship and local regulatory requirements should be checked before heavy tailoring.", "assistant"],
    ["next_action", "For every promising lead, choose a resume variant before drafting outreach.", "assistant"],
    ["conversation", "User wants enough seeded data to test filters, toggles, copy actions, conversion, and daily completion.", "user"],
  ];

  for (let index = 0; index < memories.length; index += 1) {
    const [type, text, source] = memories[index];
    await sql.query(
      "insert into memories (profile_id, type, text, source, created_at) values ($1, $2, $3, $4, $5)",
      [profileId, type, text, source, daysAgo(index)],
    );
  }
}

async function seedDailyCompletions(profileId) {
  const actions = [
    ["search-linkedin-kl-aml", "search", "Run KL operational risk search", "/leads"],
    ["resume-review", "resume", "Review resume map before applying", "/resume"],
    ["outreach-block", "outreach", "Send two recruiter messages", "/leads"],
  ];

  for (const [actionId, type, title, href] of actions) {
    await sql.query(
      `
        insert into daily_tasks (profile_id, task_date, action_id, type, title, detail, href, completed_at)
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        on conflict (profile_id, task_date, action_id) do update set completed_at = excluded.completed_at
      `,
      [profileId, today, actionId, type, title, "Seeded demo completed daily task.", href, now.toISOString()],
    );
  }
}

function app(num, daysAgoValue, company, role, score, status, bucket, notes) {
  return { num, daysAgo: daysAgoValue, company, role, score, status, bucket, notes };
}

function lead(type, status, title, company, score, notes) {
  return { type, status, title, company, score, notes };
}

function note(type, text) {
  return {
    id: `demo-${slug(type)}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    text,
    createdAt: now.toISOString(),
  };
}

function eventTypeForStatus(status) {
  if (status === "follow_up_sent") return "follow_up";
  if (status === "interview") return "interview";
  if (status === "rejected") return "rejection";
  if (status === "offer") return "offer";
  if (status === "closed") return "status_change";
  return "note";
}

function daysAgo(count) {
  const date = new Date(now);
  date.setDate(date.getDate() - count);
  return date.toISOString();
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
