import { expect, test } from "@playwright/test";

test.afterAll(async () => {
  const { execFile } = await import("node:child_process");
  await new Promise<void>((resolve, reject) => {
    execFile("node", ["scripts/cleanup-test-data.mjs"], { cwd: process.cwd() }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
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
