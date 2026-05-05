import { loadProfile, loadProfileAsync, type CareerProfile, type ResumeTemplate } from "./profile";

export type ResumeRecommendation = {
  recommended: ResumeTemplate;
  score: number;
  reason: string;
  positioning: string;
  keywords: string[];
  cautions: string[];
  alternatives: Array<ResumeTemplate & { score: number }>;
};

export function recommendResume(input: string): ResumeRecommendation {
  const profile = loadProfile();
  return recommendResumeForProfile(input, profile);
}

export async function recommendResumeAsync(input: string): Promise<ResumeRecommendation> {
  const profile = await loadProfileAsync();
  return recommendResumeForProfile(input, profile);
}

export function recommendResumeForProfile(input: string, profile: CareerProfile): ResumeRecommendation {
  const text = input.toLowerCase();
  const scored = profile.resumeTemplates
    .map((template) => ({
      ...template,
      score: scoreTemplate(template, text),
    }))
    .sort((a, b) => b.score - a.score);
  const recommended = scored[0] || profile.resumeTemplates[0];
  const keywords = extractKeywords(text);
  const cautions = extractCautions(text);

  return {
    recommended,
    score: recommended.score,
    reason: buildReason(recommended.name, text),
    positioning: buildPositioning(recommended.name),
    keywords,
    cautions,
    alternatives: scored.slice(1, 4),
  };
}

export function resumeStudioSummary() {
  const profile = loadProfile();
  return resumeStudioSummaryForProfile(profile);
}

export async function resumeStudioSummaryAsync() {
  const profile = await loadProfileAsync();
  return resumeStudioSummaryForProfile(profile);
}

function resumeStudioSummaryForProfile(profile: CareerProfile) {
  return {
    templates: profile.resumeTemplates,
    roleFamilies: [
      "KYC / CDD / EDD / ECDD",
      "Transaction Monitoring",
      "AML Investigations",
      "SAR / STR / SMR Reporting",
      "Broad Financial Crime Compliance",
    ],
  };
}

function scoreTemplate(template: ResumeTemplate, text: string) {
  const source = `${template.name} ${template.focus} ${template.notes}`.toLowerCase();
  let score = 2;

  if (/kyc|kyb|cdd|edd|ecdd|onboarding|refresh|beneficial ownership|client due diligence/.test(text)) {
    score += source.includes("kyc") || source.includes("due diligence") ? 2.2 : 0.4;
  }
  if (/transaction monitoring|alert|surveillance|investigation|investigations|tm/.test(text)) {
    score += source.includes("transaction monitoring") || source.includes("investigation") ? 2.1 : 0.5;
  }
  if (/sar|str|smr|suspicious|regulatory reporting|reporting/.test(text)) {
    score += source.includes("reporting") || source.includes("sar") || source.includes("str") ? 2.1 : 0.5;
  }
  if (/compliance|financial crime|aml|fcc|quality|qa|checker|controls|risk/.test(text)) {
    score += source.includes("compliance") || source.includes("qa") || source.includes("controls") ? 1.8 : 0.8;
  }
  if (/manager|lead|senior|specialist/.test(text)) {
    score += 0.4;
  }

  return Math.min(5, Math.round(score * 10) / 10);
}

function extractKeywords(text: string) {
  const keywords = [
    ["KYC / CDD / EDD", /kyc|cdd|edd|ecdd|due diligence/],
    ["Transaction Monitoring", /transaction monitoring|alert|surveillance|tm/],
    ["AML Investigations", /aml|investigation|investigations/],
    ["SAR / STR / SMR", /sar|str|smr|suspicious/],
    ["Sanctions / PEP / Adverse Media", /sanctions|pep|adverse media/],
    ["Quality Review / Checker", /qa|quality|checker|maker checker/],
    ["Regulatory Documentation", /documentation|regulatory|reporting/],
    ["APAC / Singapore / Malaysia", /apac|singapore|malaysia|kuala lumpur/],
  ] as const;

  return keywords
    .filter(([, pattern]) => pattern.test(text))
    .map(([label]) => label)
    .slice(0, 8);
}

function extractCautions(text: string) {
  const cautions = [];
  if (/sponsor|visa|employment pass|work authorization/.test(text)) {
    cautions.push("Check work authorization wording and whether sponsorship is explicitly supported.");
  }
  if (/junior|graduate|intern/.test(text)) {
    cautions.push("Role may be too junior for a 10+ year profile.");
  }
  if (/sales|customer success|business development/.test(text)) {
    cautions.push("Role may drift away from core AML/FCC delivery.");
  }
  if (!/aml|kyc|cdd|edd|transaction|financial crime|compliance|sar|str|sanctions/.test(text)) {
    cautions.push("JD snippet has limited AML/KYC/FCC signals; review manually before applying.");
  }
  return cautions;
}

function buildReason(templateName: string, text: string) {
  if (templateName.includes("KYC")) {
    return "Best fit because the role language points toward due diligence, onboarding, refresh, beneficial ownership, or KYC operations.";
  }
  if (templateName.includes("ECDD") || /transaction monitoring|alert|investigation/.test(text)) {
    return "Best fit because the role language points toward ECDD, transaction monitoring, alerts, or AML investigations.";
  }
  if (templateName.includes("Reporting")) {
    return "Best fit because the role language points toward suspicious reporting, investigation writing, or regulatory documentation.";
  }
  return "Best fit for broad AML/FCC, controls, compliance, QA, or financial crime roles.";
}

function buildPositioning(templateName: string) {
  if (templateName.includes("KYC")) {
    return "Lead with KYC/CDD/EDD/ECDD depth, client risk review, beneficial ownership, sanctions/PEP/adverse media checks, and regulatory-quality documentation.";
  }
  if (templateName.includes("ECDD")) {
    return "Lead with transaction monitoring alert review, escalation judgment, ECDD, suspicious activity analysis, and AML investigation workflow.";
  }
  if (templateName.includes("Reporting")) {
    return "Lead with SAR/STR/SMR reporting, investigation narrative quality, regulatory awareness, and clear case documentation.";
  }
  return "Lead with full AML/FCC lifecycle experience, global banking exposure, controls awareness, QA/checker strength, and adaptable compliance delivery.";
}
