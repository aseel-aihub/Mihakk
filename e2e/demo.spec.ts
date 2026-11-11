import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

// Shared server state (the saved evaluation run) is reset before each project's run.
test.beforeAll(async () => {
  await fs.rm(path.join(process.cwd(), ".mihakk"), { recursive: true, force: true });
});

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test("recording flow: home, sample report, shield rejection, evaluation dashboard", async ({ page, request }) => {
  // Open Mihakk
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Mihakk", level: 1 })).toBeVisible();
  await expect(page.getByRole("img", { name: "Mihakk logo" }).first()).toBeVisible();
  await noHorizontalScroll(page);
  await page.getByRole("link", { name: /Try Mihakk/ }).click();
  await expect(page).toHaveURL(/\/lab$/);

  // Select the sample sales report (default) and run the summary
  await expect(page.getByRole("radio", { name: /sample sales report/i })).toBeChecked();
  await page.getByRole("button", { name: "Run summary" }).click();
  await expect(page.getByTestId("extraction-status")).toContainText("Extracted (TXT");
  await expect(page.getByTestId("file-name")).toHaveText("q3_sales_report.txt");
  await expect(page.getByTestId("summary-mode")).toContainText("Local extractive");
  await expect(page.getByTestId("summary")).toContainText("4.8 million riyals");
  await expect(page.getByTestId("summary")).not.toContainText("audit@example.test");
  await expect(page.getByTestId("ignored")).toContainText("untrusted data");
  await expect(page.getByTestId("contract")).toContainText("Allowed file (only this one)");
  await noHorizontalScroll(page);

  // Show the shield reject a simulated out-of-scope action
  await page.getByRole("button", { name: /Simulate: send an email/ }).click();
  const sim = page.getByTestId("sim-result").first();
  await expect(sim).toContainText("Denied");
  await expect(sim).toContainText("Blocked");
  await page.getByRole("button", { name: /Simulate: read a different file/ }).click();
  await expect(page.getByTestId("sim-result").first()).toContainText("payroll_2026.txt");
  const log = page.getByTestId("decision-log");
  await expect(log).toContainText("Allowed");
  await expect(log.getByText("Denied").first()).toBeVisible();
  await noHorizontalScroll(page);

  // Open the evaluation dashboard: not run yet
  await page.getByRole("link", { name: "Results" }).first().click();
  await expect(page.getByText("The evaluation has not run yet")).toBeVisible();

  // Run all 100 cases using the keyboard
  const runBtn = page.getByRole("button", { name: "Run Evaluation" });
  await runBtn.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("cases-ran")).toContainText("100 of 100 cases ran", { timeout: 60_000 });

  // Verify displayed numbers against the exported report
  const report = await (await request.get("/api/evaluate/export?format=json")).json();
  const s = report.summary;
  expect(s.total).toBe(100);
  await expect(page.getByTestId("kpi-pass")).toContainText(`${s.pass} of ${s.total}`);
  await expect(page.getByTestId("kpi-baseline")).toContainText(`${s.disallowed.baselineAccepted} of ${s.disallowed.total}`);
  await expect(page.getByTestId("kpi-shield")).toContainText(`${s.disallowed.shieldAccepted} of ${s.disallowed.total}`);
  await expect(page.getByTestId("kpi-legit")).toContainText(`${s.legit.completed} of ${s.legit.total}`);
  await expect(page.getByTestId("kpi-falseblock")).toContainText(`${s.legit.falseBlocks} of ${s.legit.total}`);
  await expect(page.getByTestId("category-table")).toContainText("Untrusted document content");
  for (const c of s.byCategory) await expect(page.getByTestId("category-table")).toContainText(`${c.pass} of ${c.total}`);
  await expect(page.getByTestId("kind-table")).toContainText(`${s.byKind.policy.pass} of ${s.byKind.policy.total}`);
  await expect(page.getByTestId("kind-table")).toContainText(`${s.byKind.agent.pass} of ${s.byKind.agent.total}`);
  await expect(page.getByTestId("cases-table").locator("tbody tr")).toHaveCount(100);
  expect(report.run.cases).toHaveLength(100);
  expect(report.run.cases.filter((c: { status: string }) => c.status === "not-run")).toHaveLength(0);

  // CSV export has a header plus 100 rows
  const csv = await (await request.get("/api/evaluate/export?format=csv")).text();
  expect(csv.trim().split("\n")).toHaveLength(101);
  await expect(page.getByRole("link", { name: /Download CSV/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Download JSON/ })).toBeVisible();
  await noHorizontalScroll(page);
});

test("file handling messages and PDF support", async ({ page }) => {
  await page.goto("/lab");
  await page.getByRole("radio", { name: /Upload your own file/i }).check();
  const input = page.getByLabel("Upload a file");
  const run = page.getByRole("button", { name: "Run summary" });

  await input.setInputFiles({ name: "tool.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ") });
  await run.click();
  await expect(page.getByText("File not accepted (UNSUPPORTED_TYPE)")).toBeVisible();

  await input.setInputFiles({ name: "empty.txt", mimeType: "text/plain", buffer: Buffer.alloc(0) });
  await run.click();
  await expect(page.getByText("File not accepted (EMPTY_FILE)")).toBeVisible();

  await input.setInputFiles({ name: "big.txt", mimeType: "text/plain", buffer: Buffer.alloc(1_048_577, 97) });
  await run.click();
  await expect(page.getByText("File not accepted (FILE_TOO_LARGE)")).toBeVisible();

  await input.setInputFiles({ name: "fake.pdf", mimeType: "application/pdf", buffer: Buffer.from("not a pdf") });
  await run.click();
  await expect(page.getByText("File not accepted (DAMAGED_FILE)")).toBeVisible();

  await input.setInputFiles(path.join(process.cwd(), "fixtures", "image_only_scan.pdf"));
  await run.click();
  await expect(page.getByText("File not accepted (IMAGE_ONLY_PDF)")).toBeVisible();

  await input.setInputFiles(path.join(process.cwd(), "fixtures", "text_report.pdf"));
  await run.click();
  await expect(page.getByTestId("extraction-status")).toContainText("Extracted (PDF");
  await expect(page.getByTestId("summary")).toContainText("shipments");
  await expect(page.getByTestId("contract")).toContainText("text_report.pdf");
});

test("home, about and layout work at this screen size", async ({ page }) => {
  for (const p of ["/", "/lab", "/results", "/about"]) {
    await page.goto(p);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await noHorizontalScroll(page);
  }
  await expect(page.getByText("Roadmap: Arabic and Saudi dialect support (future enhancement)")).toBeVisible();
});
