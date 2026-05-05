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
  Authentication: LockKeyhole,
  Database,
  "LinkedIn OAuth": Link2,
};

export default function SettingsPage() {
  const status = loadSettingsStatus();
  const readyChecks = status.productionChecks.filter((check) => check.ready).length;
  const presentFiles = status.storageFiles.filter((file) => file.exists).length;

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="section">
          <SectionTitle
            title="Settings"
            text="Readiness view for local pilot mode, AI configuration, data storage, and the pieces needed before Vercel production launch."
          />
          <div className="metricGrid dashboardMetrics">
            <MetricCard value={readyChecks} label="Production checks ready" />
            <MetricCard value={status.openAiConfigured ? "AI" : "Local"} label="Assistant mode" />
            <MetricCard value={presentFiles} label="Local data files found" />
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
              <span className="statusPill">Pilot</span>
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
              <span className="statusPill">Next production slice</span>
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
                      <span className="tag amber">{milestone.status}</span>
                    </div>
                    <p>{milestone.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="panel">
            <div className="panelHeader">
              <strong>Auth recommendation</strong>
              <span className="statusPill">Clerk</span>
            </div>
            <p className="settingsAsideText">
              Use Clerk first for secure login, hosted account UI, and Vercel-friendly
              route protection. Auth.js remains the self-managed alternative.
            </p>
            <Link className="button secondary cardButton" href="/login">
              Open login plan
            </Link>
          </aside>
        </section>

        <section className="section">
          <SectionTitle
            title="Database Boundary"
            text="Postgres has a shared readiness check now. Repositories fail through this one boundary until a driver and implementation are wired."
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
                <span>Neon serverless driver is installed. Repository implementations are still blocked.</span>
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
            title="Selected Database Path"
            text="This is the recommended provider route for the first production deployment."
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
                <strong>Wiring steps</strong>
                <span className="statusPill">Next</span>
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
            text="The app keeps using local files today, with a clear switch point for Postgres once repository methods are connected."
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
                  <span>Postgres active areas</span>
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
            text="Repository boundaries are in place for the core runtime modules. Postgres implementations are still deliberately blocked."
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
            text="These files make the current single-profile pilot work. Production should move this shape into a user-scoped database."
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
            text="The first Postgres schema for turning the local pilot into a real account-based product."
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
              <span className="statusPill">Database next</span>
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
            text="Provider-neutral Postgres SQL is ready, but the app still uses local files until a database is connected."
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
              text="Move tracker, leads, profile, memory, and daily action state from files into user-scoped tables."
            />
            <Feature
              icon={<Globe2 size={20} />}
              title="Domain"
              text="Point app.vyomaai.in to Vercel and keep the Wix site as the public marketing surface if needed."
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
