import { expect, test } from "@playwright/test";

test("opens an experiment and switches panel tabs", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Change workspace" }).click();
  await page.getByRole("menuitem", { name: "Choose folder…" }).click();

  await page.getByRole("link", { name: "Experiments" }).click();
  await page.getByRole("button", { name: "experiment-001" }).click();

  await expect(
    page.getByRole("heading", { name: "experiment-001", level: 2 }),
  ).toBeVisible();
  await expect(page.getByRole("tab")).toHaveText([
    "Read mapping",
    "Region coverage",
    "AA changes",
    "Settings",
  ]);

  await page.getByRole("tab", { name: "AA changes" }).click();
  await expect(page.getByText("summary.aa_changes.csv")).toBeVisible();

  await page.getByRole("tab", { name: "Settings" }).click();
  await expect(page.getByText("Pf3D7")).toBeVisible();
});
