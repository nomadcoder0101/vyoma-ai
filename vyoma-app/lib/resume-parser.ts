export type ParsedResumeSummary = {
  status: "parsed" | "limited" | "empty";
  extractedAt: string;
  wordCount: number;
  characterCount: number;
  detectedSections: string[];
  roleSignals: string[];
  skillSignals: string[];
  notes: string[];
};

const sectionPatterns: Array<[string, RegExp]> = [
  ["Summary", /\b(summary|profile|objective)\b/i],
  ["Experience", /\b(experience|employment|work history|professional history)\b/i],
  ["Education", /\b(education|qualification|degree|university)\b/i],
  ["Skills", /\b(skills|competencies|expertise|tools)\b/i],
  ["Certifications", /\b(certification|certifications|certificate|training)\b/i],
  ["Projects", /\b(projects|engagements)\b/i],
];

const rolePatterns: Array<[string, RegExp]> = [
  ["KYC / CDD / EDD", /\b(kyc|cdd|edd|ecdd|due diligence|onboarding|refresh)\b/i],
  ["AML Investigations", /\b(aml|anti-money laundering|investigation|investigations)\b/i],
  ["Transaction Monitoring", /\b(transaction monitoring|alert review|alerts|surveillance)\b/i],
  ["Financial Crime Compliance", /\b(financial crime|fcc|compliance|cft)\b/i],
  ["Regulatory Reporting", /\b(sar|str|smr|suspicious|regulatory reporting)\b/i],
  ["Sanctions / PEP", /\b(sanctions|pep|adverse media|screening)\b/i],
];

const skillPatterns: Array<[string, RegExp]> = [
  ["Case documentation", /\b(documentation|case narrative|case notes|quality review|qa)\b/i],
  ["Risk assessment", /\b(risk assessment|risk rating|high risk|beneficial ownership)\b/i],
  ["Stakeholder management", /\b(stakeholder|client relationship|business unit|operations)\b/i],
  ["Banking operations", /\b(bank|banking|financial institution|global bank)\b/i],
  ["Regulatory awareness", /\b(regulatory|regulator|compliance standards|policy|procedure)\b/i],
];

export async function parseResumeFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const notes: string[] = [];
  let fullText = "";

  if (file.type === "application/pdf") {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const parsed = await parser.getText();
      await parser.destroy();
      fullText = parsed.text || "";
    } catch {
      notes.push("PDF text extraction failed. The uploaded file is still stored.");
    }
  } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      const mammoth = await import("mammoth");
      const parsed = await mammoth.extractRawText({ buffer });
      fullText = parsed.value || "";
      if (parsed.messages?.length) {
        notes.push("DOCX parsed with conversion warnings.");
      }
    } catch {
      notes.push("DOCX text extraction failed. The uploaded file is still stored.");
    }
  } else {
    notes.push("Legacy DOC upload is stored, but automatic text parsing is limited. Convert to PDF or DOCX for full parsing.");
  }

  fullText = normalizeResumeText(fullText);
  return {
    fullText,
    parsedSummary: summarizeResumeText(fullText, notes),
  };
}

export function summarizeResumeText(fullText: string, notes: string[] = []): ParsedResumeSummary {
  const normalized = normalizeResumeText(fullText);
  const words = normalized ? normalized.split(/\s+/).filter(Boolean) : [];
  const detectedSections = sectionPatterns
    .filter(([, pattern]) => pattern.test(normalized))
    .map(([label]) => label);
  const roleSignals = rolePatterns
    .filter(([, pattern]) => pattern.test(normalized))
    .map(([label]) => label);
  const skillSignals = skillPatterns
    .filter(([, pattern]) => pattern.test(normalized))
    .map(([label]) => label);

  return {
    status: normalized ? "parsed" : notes.length ? "limited" : "empty",
    extractedAt: new Date().toISOString(),
    wordCount: words.length,
    characterCount: normalized.length,
    detectedSections,
    roleSignals,
    skillSignals,
    notes,
  };
}

function normalizeResumeText(value: string) {
  return value.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
