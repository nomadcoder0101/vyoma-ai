import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

const hasBlobToken = Boolean(loadLocalEnv().BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN);
const testStamp = Date.now();
const testResumeName = `Vyoma E2E Resume ${testStamp}`;
const testCompany = `Vyoma E2E Bank ${testStamp}`;
const testRole = `Senior Transaction Monitoring Analyst E2E ${testStamp}`;

test.beforeAll(async () => {
  await cleanupTestData();
});

test.afterAll(async () => {
  await cleanupTestData();
});

test("signed-in user can reach core app areas", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText(/command center/i)).toBeVisible();

  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: /profile setup/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /add resume/i })).toBeVisible();

  await page.goto("/resume");
  await expect(page.getByRole("heading", { name: /resume studio/i })).toBeVisible();

  await page.goto("/leads");
  await expect(page.getByRole("heading", { name: /lead intake/i })).toBeVisible();

  await page.goto("/tracker");
  await expect(page.getByRole("heading", { name: /application tracker/i })).toBeVisible();
});

test("user can upload resume, save profile, process a lead, convert it, and complete a daily task", async ({
  page,
}) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: /add resume/i }).click();

  const lastResumeRow = page.locator(".resumeRow").last();
  await lastResumeRow.getByLabel(/resume file name or version/i).fill(testResumeName);
  await lastResumeRow.getByLabel(/resume target focus/i).fill("E2E transaction monitoring and AML investigations");
  await lastResumeRow
    .getByLabel(/resume notes or link/i)
    .fill("Created by local E2E test for upload, profile save, and resume comment coverage.");
  await lastResumeRow
    .getByLabel(/resume comment/i)
    .fill("E2E comment: use this version for transaction monitoring lead checks.");

  const uploadInput = lastResumeRow.locator("input[type='file']");
  await uploadInput.setInputFiles({
    name: "vyoma-e2e-resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(minimalPdf("Vyoma E2E resume Transaction Monitoring AML KYC CDD EDD SAR STR")),
  });

  if (hasBlobToken) {
    await expect(page.getByText(/resume uploaded and parsed/i)).toBeVisible();
    await expect(page.getByText(/words parsed/i)).toBeVisible();
  } else {
    await expect(page.getByText(/BLOB_READ_WRITE_TOKEN/i)).toBeVisible();
  }

  await page.getByRole("button", { name: /save draft/i }).click();
  await expect(page.getByText(/profile draft saved/i)).toBeVisible();
  await expect(page.getByText(testResumeName)).toBeVisible();

  await page.goto("/leads");
  await page.getByLabel(/^url$/i).fill(`https://www.linkedin.com/jobs/view/${testStamp}`);
  await page.getByLabel(/title or contact name/i).fill(testRole);
  await page.getByLabel(/^company$/i).fill(testCompany);
  await page
    .getByLabel(/^notes$/i)
    .fill("E2E lead for AML transaction monitoring, alert reviews, SAR reporting, and Employment Pass review.");
  await page.getByRole("button", { name: /save lead/i }).click();
  await expect(page.getByText(testRole)).toBeVisible();

  const leadCard = page.locator(".leadCard", { hasText: testRole });
  await leadCard.getByRole("button", { name: /evaluate/i }).click();
  await expect(leadCard.getByText(/Evaluation/i)).toBeVisible();
  await expect(leadCard.locator(".leadSignal strong").filter({ hasText: /\/5/ })).toBeVisible();

  await leadCard.getByRole("button", { name: /draft outreach/i }).click();
  await expect(leadCard.getByText(/Outreach draft/i)).toBeVisible();

  await leadCard.getByRole("button", { name: /recommend resume/i }).click();
  await expect(leadCard.getByText(/Resume recommendation/i)).toBeVisible();

  await leadCard.getByRole("button", { name: /add to tracker/i }).click();
  await expect(page.getByText(/lead added to the application tracker/i)).toBeVisible();

  await page.goto("/tracker");
  await expect(page.getByText(testCompany)).toBeVisible();
  await expect(page.getByText(testRole)).toBeVisible();

  await page.goto("/daily-plan");
  const firstDailyAction = page.locator(".dailyAction").first();
  await expect(firstDailyAction).toBeVisible();
  await firstDailyAction.getByRole("button", { name: /mark done/i }).click();
  await expect(page.locator(".dailyAction.done").first()).toBeVisible();
});

async function cleanupTestData() {
  const { execFile } = await import("node:child_process");
  await new Promise<void>((resolve, reject) => {
    execFile("node", ["scripts/cleanup-test-data.mjs"], { cwd: process.cwd() }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function loadLocalEnv() {
  if (!existsSync(".env.local")) return {} as Record<string, string>;
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^["']|["']$/g, "")];
      }),
  );
}

function minimalPdf(text: string) {
  return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 96 >>
stream
BT
/F1 12 Tf
72 720 Td
(${text.replace(/[()\\]/g, "")}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
trailer
<< /Root 1 0 R >>
%%EOF`;
}
