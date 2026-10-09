import { expect, test } from "@playwright/test";

test("selects a workspace folder", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No workspace selected")).toBeVisible();

  await page.getByRole("button", { name: "Change workspace" }).click();
  await page.getByRole("menuitem", { name: "Choose folder…" }).click();

  const path = "/mock/workspaces/run-001";
  await expect(
    page.getByRole("button", { name: "Change workspace" }),
  ).toContainText(path);
  await expect(page.getByText("No workspace selected")).toBeHidden();

  await page.getByRole("button", { name: "Change workspace" }).click();
  await expect(page.getByText("Recent workspaces")).toBeVisible();
  await expect(page.getByRole("menuitem", { name: path })).toBeVisible();
});
