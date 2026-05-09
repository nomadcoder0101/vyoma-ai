import { addLead, addLeadAsync, updateLead, updateLeadAsync, type Lead, type LeadType } from "./leads";

export type LeadImportPreview = {
  type: LeadType;
  url: string;
  title: string;
  company: string;
  notes: string;
  location: string;
  sponsorshipClues: string[];
};

export function parseLeadText(rawText: string): LeadImportPreview {
  const text = rawText.trim();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const url = extractUrl(text);
  const title = inferTitle(lines, text);
  const company = inferCompany(lines);
  const location = inferLocation(text);
  const sponsorshipClues = inferSponsorshipClues(text);
  const notes = [
    location ? `Location: ${location}` : "",
    sponsorshipClues.length ? `Sponsorship clues: ${sponsorshipClues.join(", ")}` : "",
    `Imported from raw job text: ${compact(text).slice(0, 900)}`,
  ]
    .filter(Boolean)
    .join("; ");

  return {
    type: "job",
    url: url || "https://www.linkedin.com/jobs/search/",
    title,
    company,
    notes,
    location,
    sponsorshipClues,
  };
}

export function importLeadFromText(rawText: string) {
  const preview = parseLeadText(rawText);
  const lead = addLead(preview);
  const evaluated = updateLead(lead.id, "evaluate") as Lead;
  const drafted = updateLead(evaluated.id, "draft") as Lead;
  const withResume = updateLead(drafted.id, "resume") as Lead;

  return {
    preview,
    lead: withResume,
  };
}

export async function importLeadFromTextAsync(rawText: string) {
  const preview = parseLeadText(rawText);
  const lead = await addLeadAsync(preview);
  const evaluated = (await updateLeadAsync(lead.id, "evaluate")) as Lead;
  const drafted = (await updateLeadAsync(evaluated.id, "draft")) as Lead;
  const withResume = (await updateLeadAsync(drafted.id, "resume")) as Lead;

  return {
    preview,
    lead: withResume,
  };
}

function extractUrl(text: string) {
  return text.match(/https?:\/\/\S+/)?.[0]?.replace(/[),.]+$/, "") || "";
}

function inferTitle(lines: string[], text: string) {
  const labeled = text.match(/(?:title|role|position)\s*:\s*(.+)/i)?.[1];
  if (labeled) return cleanLine(labeled);
  const candidate = lines.find((line) =>
    /analyst|specialist|manager|lead|officer|consultant|investigator|compliance|kyc|aml|financial crime/i.test(
      line,
    ),
  );
  return cleanLine(candidate || lines[0] || "Imported job lead");
}

function inferCompany(lines: string[]) {
  const labeled = lines
    .join("\n")
    .match(/(?:company|employer|organization|organisation)\s*:\s*(.+)/i)?.[1];
  if (labeled) return cleanLine(labeled);

  const companyLine = lines.find((line) =>
    /bank|capital|financial|fintech|compliance|group|limited|ltd|berhad|consulting|deloitte|citi|standard chartered|hsbc|uob|maybank|ocbc/i.test(
      line,
    ),
  );
  return cleanLine(companyLine || "");
}

function inferLocation(text: string) {
  const locations = [
    "Kuala Lumpur",
    "Malaysia",
    "Singapore",
    "Remote",
    "APAC",
    "Australia",
    "New Zealand",
  ];
  return locations.filter((location) => new RegExp(location, "i").test(text)).join(", ");
}

function inferSponsorshipClues(text: string) {
  const clues = [];
  if (/sponsor|sponsorship/i.test(text)) clues.push("sponsorship mentioned");
  if (/employment pass|ep\b/i.test(text)) clues.push("Employment Pass mentioned");
  if (/work authorization|work authorisation|right to work/i.test(text)) {
    clues.push("work authorization mentioned");
  }
  if (/citizen|permanent resident|pr only|local only/i.test(text)) {
    clues.push("possible local-only restriction");
  }
  if (/remote|contractor/i.test(text)) clues.push("remote/contractor clue");
  return clues;
}

function cleanLine(value: string) {
  return value.replace(/^[-*•\s]+/, "").replace(/\s+/g, " ").trim().slice(0, 140);
}

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
