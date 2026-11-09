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

  // Read mapping is backed by the browser implementation of the native contract.
  await page.getByRole("button", { name: /NTC_2.*barcode47/ }).click();
  const readMappingDetails = page.getByRole("status");
  await expect(readMappingDetails).toContainText("NTC_2");
  await expect(readMappingDetails).toContainText("barcode47");
  await expect(page.getByRole("button", { name: /unclassified/i })).toHaveCount(
    0,
  );
  await expect(page.getByTestId("unclassified-share")).toContainText("%");
  await expect(
    page.getByRole("group", {
      name: "Read-type composition across demultiplexed barcodes",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    readMappingDetails.getByRole("group", {
      name: "Read-type composition for NTC_2",
      exact: true,
    }),
  ).toBeVisible();
  await expect(readMappingDetails).toContainText(
    "3 target-species reads detected",
  );
  await expect(
    page.getByText(/Design preview|illustrative|mockup/),
  ).toHaveCount(0);

  await page.getByRole("tab", { name: "Region coverage" }).click();
  await expect(
    page.getByRole("heading", { name: "Region coverage", level: 3 }),
  ).toBeVisible();
  await expect(page.getByText("All selected barcodes")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Select NTC_2.*barcode47/ }),
  ).toBeVisible();
  await expect(page.getByText("PC").first()).toBeVisible();
  await expect(page.getByText("NC").first()).toBeVisible();
  const regionDetails = page.getByRole("status");
  await page
    .locator(".recharts-reference-area-rect")
    .nth(2)
    .click({ position: { x: 5, y: 5 }, force: true });
  await expect(regionDetails).toContainText("Sample_03");
  await expect(regionDetails).toContainText("barcode03");
  await page.locator(".recharts-scatter-symbol").nth(1).click({ force: true });
  await expect(regionDetails).toContainText("Sample_02");
  await expect(regionDetails).toContainText("barcode02");
  await page.getByRole("button", { name: "Hide crt-p14-125" }).dblclick();
  await expect(
    page.getByRole("button", { name: "Show ama1-p74-384" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hide crt-p14-125" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show csp-p19-398" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "ama1-p74-384" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /unclassified/i })).toHaveCount(
    0,
  );
  await expect(page.getByRole("cell", { name: /unclassified/i })).toHaveCount(
    0,
  );

  await page.getByRole("tab", { name: "AA changes" }).click();
  await expect(page.getByText("4 variants · 48 samples")).toBeVisible();
  await expect(page.getByText("Positive control")).toBeVisible();
  await expect(page.getByText("PC", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("NC", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Select NTC_2 · barcode47" }).click();
  await expect(page.getByText("Negative control")).toBeVisible();
  await expect(page.getByRole("button", { name: /unclassified/i })).toHaveCount(
    0,
  );

  await page.getByRole("tab", { name: "Settings" }).click();
  await expect(page.getByText("Pf3D7")).toBeVisible();
});

test("filters read mapping with the barcode selection and resets per experiment", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Change workspace" }).click();
  await page.getByRole("menuitem", { name: "Choose folder…" }).click();
  await page.getByRole("link", { name: "Experiments" }).click();
  await page.getByRole("button", { name: "experiment-001" }).click();

  const heading = page.getByRole("heading", { name: "experiment-001" });
  const samplesLink = page.getByRole("button", { name: "48/48 Samples" });
  await expect(samplesLink).toBeVisible();
  const headingBox = await heading.boundingBox();
  const samplesBox = await samplesLink.boundingBox();
  expect(headingBox).not.toBeNull();
  expect(samplesBox).not.toBeNull();
  if (headingBox === null || samplesBox === null) {
    throw new Error("Experiment heading or samples link is not visible");
  }
  expect(samplesBox.x).toBeGreaterThan(headingBox.x + headingBox.width);
  expect(samplesBox.y).toBeGreaterThanOrEqual(headingBox.y);
  expect(samplesBox.y).toBeLessThan(headingBox.y + headingBox.height);
  await samplesLink.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveAccessibleName("Samples");
  await dialog.getByRole("button", { name: "Select none" }).click();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(
    page.getByRole("button", { name: "48/48 Samples" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "48/48 Samples" }).click();
  await dialog.getByRole("button", { name: "Select none" }).click();
  await dialog.getByRole("button", { name: "Apply" }).click();
  await expect(
    page.getByRole("button", { name: "0/48 Samples" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "0/48 Samples" }).click();
  await dialog.getByRole("checkbox", { name: "Select barcode02" }).check();
  await dialog.getByRole("button", { name: "Apply" }).click();

  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "1/48 Samples" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Select Sample_02 (barcode02)" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Select .*\(barcode47\)/ }),
  ).toHaveCount(0);

  await page.getByRole("tab", { name: "Region coverage" }).click();
  await expect(
    page.getByRole("button", { name: "Select Sample_02 (barcode02)" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Select .*\(barcode47\)/ }),
  ).toHaveCount(0);

  await page.getByRole("tab", { name: "AA changes" }).click();
  await expect(
    page.getByRole("button", { name: "Select Sample_02 · barcode02" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Select .*barcode47/ }),
  ).toHaveCount(0);

  await page.getByRole("link", { name: "Experiments", exact: true }).click();
  await page.getByRole("button", { name: "experiment-002" }).click();
  await expect(
    page.getByRole("button", { name: "48/48 Samples" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Select .*\(barcode47\)/ }),
  ).toBeVisible();
});
