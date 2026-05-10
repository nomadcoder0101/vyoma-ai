import {
  Bot,
  Database,
  FileText,
  Globe2,
  KeyRound,
  Link2,
  LockKeyhole,
  ServerCog,
} from "lucide-react";
import Link from "next/link";
import { authMilestones } from "../../lib/auth-plan";
import { databaseTables, migrationFiles, migrationSteps } from "../../lib/database-schema";
import { loadSettingsStatus } from "../../lib/settings";
import { Feature, Footer, MetricCard, SectionTitle, Topbar } from "../components";

const checkIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  "OpenAI API key": Bot,
  "Clerk authentication": LockKeyhole,
  Database,
  "Resume file upload": FileText,
  "LinkedIn OAuth": Link2,
};

export default function SettingsPage() {
  const status = loadSettingsStatus();
  const readyChecks = status.productionChecks.filter((check) => check.ready).length;

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section">
          <SectionTitle
            title="Settings"
            text="Readiness view for authentication, AI, Postgres storage, resume uploads, integrations, and deployment health."
          />
          <div className="metricGrid dashboardMetrics">
            <MetricCard value={readyChecks} label="Production checks ready" />
            <MetricCard value={status.openAiConfigured ? "AI" : "Local"} label="Assistant mode" />
            <MetricCard value={status.storageAdapter.mode === "postgres" ? "Postgres" : "Local"} label="Runtime storage" />
            <MetricCard value={status.storageAdapter.parity.converted} label="Storage adapters converted" />
          </div>
        </section>

        <section className="section settingsLayout">
          <div className="panel">
            <div className="panelHeader">
              <strong>Production readiness</strong>
              <span className="statusPill">{readyChecks} of {status.productionChecks.length} ready</span>
            </div>
            <div className="settingsList">
              {status.productionChecks.map((check) => {
                const Icon = checkIcons[check.label] || ServerCog;
                return (
                  <article className="settingsItem" key={check.label}>
                    <span className="cardIcon">
                      <Icon size={20} />
                    </span>
                    <div>
                      <div className="settingsItemTop">
                        <strong>{check.label}</strong>
                        <span className={`tag ${check.ready ? "teal" : "amber"}`}>
                          {check.ready ? "Ready" : "Needed"}
                        </span>
                      </div>
                      <p>{check.detail}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="panel">
            <div className="panelHeader">
              <strong>Runtime</strong>
              <span className="statusPill">Live</span>
            </div>
            <div className="settingsFacts">
              <div>
                <span>App URL</span>
                <strong>{status.appUrl}</strong>
              </div>
              <div>
                <span>AI model</span>
                <strong>{status.openAiModel}</strong>
              </div>
              <div>
                <span>Storage mode</span>
                <strong>{status.storageAdapter.activeLabel}</strong>
              </div>
              <div>
                <span>Database</span>
                <strong>{status.database.ready ? "Ready" : "Not wired"}</strong>
              </div>
              <div>
                <span>Data root</span>
                <strong>{status.dataRoot}</strong>
              </div>
            </div>
          </aside>
        </section>

        <section className="section settingsLayout">
          <div className="panel">
            <div className="panelHeader">
              <strong>Authentication boundary</strong>
              <span className="statusPill">Clerk active</span>
            </div>
            <div className="settingsList">
              {authMilestones.slice(0, 3).map((milestone) => (
                <article className="settingsItem" key={milestone.title}>
                  <span className="cardIcon">
                    <LockKeyhole size={20} />
                  </span>
                  <div>
                      <div className="settingsItemTop">
                        <strong>{milestone.title}</strong>
                        <span className={`tag ${milestone.status === "ready" ? "teal" : "amber"}`}>
                          {milestone.status}
                        </span>
                    </div>
                    <p>{milestone.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="panel">
            <div className="panelHeader">
              <strong>Account provider</strong>
              <span className="statusPill">Clerk</span>
            </div>
            <p className="settingsAsideText">
              Clerk is active for sign-in, sign-up, hosted account UI, route
              protection, and stable user identity mapping.
            </p>
            <Link className="button secondary cardButton" href="/login">
              Open account page
            </Link>
          </aside>
        </section>

        <section className="section">
          <SectionTitle
            title="Resume Upload Status"
            text="Resume versions can be saved today as names, role focus, notes, and cloud links. Direct upload needs blob storage."
          />
          <div className="settingsFileGrid">
            <article className="settingsFile">
              <FileText size={18} />
              <div>
                <strong>Resume metadata</strong>
                <span className="tag teal">Ready</span>
                <span>Saved in the profile as resume/CV versions and used by Resume Studio recommendations.</span>
              </div>
            </article>
            <article className="settingsFile">
              <FileText size={18} />
              <div>
                <strong>Cloud links</strong>
                <span className="tag teal">Ready</span>
                <span>Paste OneDrive, Google Drive, or file reference links in the resume notes field.</span>
              </div>
            </article>
            <article className="settingsFile">
              <ServerCog size={18} />
              <div>
                <strong>Direct file upload</strong>
                <span className={`tag ${process.env.BLOB_READ_WRITE_TOKEN ? "teal" : "amber"}`}>
                  {process.env.BLOB_READ_WRITE_TOKEN ? "Ready" : "Needs blob storage"}
                </span>
                <span>
                  Upload, protected download, comments, full-text storage, and PDF/DOCX parsing are implemented.
                </span>
              </div>
            </article>
          </div>
        </section>

        <section className="section">
          <SectionTitle
            title="Database Boundary"
            text="Postgres has a shared readiness check now. The core career operations data is wired to database repositories."
          />
          <div className="settingsFileGrid">
            <article className="settingsFile">
              <Database size={18} />
              <div>
                <strong>DATABASE_URL</strong>
                <span className={`tag ${status.database.configured ? "teal" : "amber"}`}>
                  {status.database.configured ? "Configured" : "Missing"}
                </span>
                <span>{status.database.detail}</span>
              </div>
            </article>
            <article className="settingsFile">
              <ServerCog size={18} />
              <div>
                <strong>Postgres driver</strong>
                <span className={`tag ${status.database.driverInstalled ? "teal" : "amber"}`}>
                  {status.database.driverInstalled ? "Installed" : "Not installed"}
                </span>
                <span>Neon serverless driver is installed. Core runtime repositories are database-backed.</span>
              </div>
            </article>
            <article className="settingsFile">
              <ServerCog size={18} />
              <div>
                <strong>Health endpoint</strong>
                <span className="tag teal">Available</span>
                <span>GET /api/database checks database readiness and pings Neon when credentials exist.</span>
              </div>
            </article>
          </div>
        </section>

        <section className="section">
          <SectionTitle
            title="Database Provider"
            text="The deployed app uses Neon Postgres through Vercel for user-scoped profile, tracker, leads, memory, and daily-task data."
          />
          <div className="settingsLayout">
            <div className="panel">
              <div className="panelHeader">
                <strong>{status.database.provider.name}</strong>
                <span className="statusPill">Selected</span>
              </div>
              <p className="settingsAsideText">{status.database.provider.reason}</p>
              <div className="settingsFacts providerFacts">
                <div>
                  <span>Package</span>
                  <strong>{status.database.provider.packageName}</strong>
                </div>
                <div>
                  <span>Repositories</span>
                  <strong>{status.database.repositoriesImplemented ? "Implemented" : "Blocked"}</strong>
                </div>
                <div>
                  <span>Install</span>
                  <strong>{status.database.provider.installCommand}</strong>
                </div>
                <div>
                  <span>Migrate</span>
                  <strong>npm.cmd run db:migrate</strong>
                </div>
                <div>
                  <span>Environment</span>
                  <strong>{status.database.provider.envVars.join(", ")}</strong>
                </div>
              </div>
            </div>
            <div className="panel">
              <div className="panelHeader">
                <strong>Operational steps</strong>
                <span className="statusPill">Reference</span>
              </div>
              <ol className="migrationList">
                {status.database.provider.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="section">
          <SectionTitle
            title="Storage Adapter"
            text="Core product data is wired through repository boundaries. Production uses user-scoped Postgres storage."
          />
          <div className="settingsLayout">
            <div className="panel">
              <div className="panelHeader">
                <strong>{status.storageAdapter.activeLabel}</strong>
                <span className={`tag ${status.storageAdapter.ready ? "teal" : "amber"}`}>
                  {status.storageAdapter.ready ? "Ready" : "Blocked"}
                </span>
              </div>
              <p className="settingsAsideText">{status.storageAdapter.detail}</p>
              <div className="storageParityStats">
                <div>
                  <strong>{status.storageAdapter.parity.converted}</strong>
                  <span>Repository boundaries</span>
                </div>
                <div>
                  <strong>{status.storageAdapter.parity.localActive}</strong>
                  <span>Local active areas</span>
                </div>
                <div>
                  <strong>{status.storageAdapter.parity.postgresActive}</strong>
                  <span>Postgres-ready areas</span>
                </div>
              </div>
            </div>
            <div className="settingsList">
              {status.storageAdapter.capabilities.map((capability) => (
                <article className="settingsItem" key={capability.area}>
                  <span className="cardIcon">
                    <Database size={20} />
                  </span>
                  <div>
                    <div className="settingsItemTop">
                      <strong>{capability.area}</strong>
                      <span className={`tag ${capability.local ? "teal" : "amber"}`}>
                        {capability.local ? "Local active" : "Future"}
                      </span>
                    </div>
                    <p>{capability.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <SectionTitle
            title="Integration Boundary"
            text="Official OAuth integration storage is now shaped, but local credential storage remains disabled by design."
          />
          <div className="settingsFileGrid">
            {status.integrations.map((integration) => (
              <article className="settingsFile" key={integration.provider}>
                <Link2 size={18} />
                <div>
                  <strong>{integration.label}</strong>
                  <span className={`tag ${integration.repositoryReady ? "teal" : "amber"}`}>
                    {integration.repositoryReady ? "Repository ready" : "Planned"}
                  </span>
                  <span>{integration.detail}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <SectionTitle
            title="Storage Parity Matrix"
            text="Repository boundaries are in place for the core runtime modules, with database implementations for the main product data."
          />
          <div className="storageParityGrid">
            {status.storageAdapter.capabilities.map((capability) => (
              <article className="storageParityCard" key={capability.area}>
                <div className="schemaTableTop">
                  <strong>{capability.area}</strong>
                  <span className={`tag ${capability.repository ? "teal" : "amber"}`}>
                    {capability.repository ? "Converted" : "Future"}
                  </span>
                </div>
                <div className="storageParityRows">
                  <div>
                    <span>Local source</span>
                    <strong>{capability.localSource}</strong>
                  </div>
                  <div>
                    <span>Postgres target</span>
                    <strong>{capability.postgresTarget}</strong>
                  </div>
                  <div>
                    <span>Runtime</span>
                    <strong>{capability.local ? "Local active" : "Not active"}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <SectionTitle
            title="Local Data"
            text="These local files remain as a backup/source import record. Production runtime uses user-scoped Postgres repositories."
          />
          <div className="settingsFileGrid">
            {status.storageFiles.map((file) => (
              <article className="settingsFile" key={file.file}>
                <FileText size={18} />
                <div>
                  <strong>{file.file}</strong>
                  <span className={`tag ${file.exists ? "teal" : "amber"}`}>
                    {file.exists ? "Found" : "Missing until used"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <SectionTitle
            title="Production Data Model"
            text="The current Postgres schema for account-based career operations data."
          />
          <div className="schemaGrid">
            {databaseTables.map((table) => (
              <article className="schemaTable" key={table.name}>
                <div className="schemaTableTop">
                  <strong>{table.name}</strong>
                  <span className="tag teal">{table.owner}</span>
                </div>
                <p>{table.purpose}</p>
                <span>{table.keyFields.slice(0, 5).join(", ")}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="panel">
            <div className="panelHeader">
              <strong>Migration order</strong>
              <span className="statusPill">Schema reference</span>
            </div>
            <ol className="migrationList">
              {migrationSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section">
          <SectionTitle
            title="Migration Files"
            text="Provider-neutral Postgres SQL used to create and evolve the deployed database schema."
          />
          <div className="settingsFileGrid">
            {migrationFiles.map((migration) => (
              <article className="settingsFile" key={migration.file}>
                <Database size={18} />
                <div>
                  <strong>{migration.file}</strong>
                  <span>{migration.purpose}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="grid3">
            <Feature
              icon={<KeyRound size={20} />}
              title="Environment"
              text="Use .env.local for secrets locally and Vercel environment variables after deployment."
            />
            <Feature
              icon={<Database size={20} />}
              title="Database"
              text="Profile, tracker, leads, memory, and daily actions are stored in user-scoped tables."
            />
            <Feature
              icon={<Globe2 size={20} />}
              title="Domain"
              text="The app is deployed on Vercel and available through the vyomaai.in domain aliases."
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
