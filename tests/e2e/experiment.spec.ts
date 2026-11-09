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
    "Sequencing overview",
    "Read mapping",
    "Region coverage",
    "AA changes",
    "Settings",
  ]);

  await expect(
    page.getByRole("tab", { name: "Sequencing overview" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("heading", { name: "Controls", exact: true }),
  ).toBeVisible();
  // Read mapping is backed by the browser implementation of the native contract.
  await page.getByRole("tab", { name: "Read mapping" }).click();
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
  await page
    .getByRole("region", { name: "Samples", exact: true })
    .locator(":scope > details > summary", { hasText: "Gathering data... (1)" })
    .click();
  await expect(
    page.locator("span").filter({ hasText: /^Sample_02 · barcode02$/ }),
  ).toBeVisible();
  await expect(page.getByText("Gathering data...: 1")).toBeVisible();
  await expect(page.getByText("Complete: 0")).toBeVisible();
  await expect(page.getByText("No controls selected.")).toBeVisible();
  await page.getByRole("tab", { name: "Read mapping" }).click();
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
  await page.getByRole("tab", { name: "Read mapping" }).click();
  await expect(
    page.getByRole("button", { name: /Select .*\(barcode47\)/ }),
  ).toBeVisible();
});

test("shows current overview metrics and control details", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Change workspace" }).click();
  await page.getByRole("menuitem", { name: "Choose folder…" }).click();
  await page.getByRole("link", { name: "Experiments" }).click();
  await page.getByRole("button", { name: "experiment-001" }).click();
  await expect(page.getByText(/Only amplicons present/)).toBeVisible();
  const samples = page.getByRole("region", { name: "Samples", exact: true });
  const controls = page.getByRole("region", { name: "Controls", exact: true });
  await expect(
    samples.getByRole("heading", { name: "Overall sample statuses" }),
  ).toBeVisible();
  await expect(controls.getByText("Positive controls passed")).toBeVisible();
  await expect(controls.getByText("Negative controls passed")).toBeVisible();
  await expect(
    page.locator("span").filter({ hasText: /^Sample_02 · barcode02$/ }),
  ).toBeHidden();
  await samples
    .locator(":scope > details > summary", {
      hasText: /Gathering data\.\.\. \(\d+\)/,
    })
    .click();
  const sample = samples
    .locator("details")
    .filter({
      has: page.locator("span").filter({ hasText: /^Sample_02 · barcode02$/ }),
    })
    .last();
  await sample.locator(":scope > summary").click();
  await expect(
    sample.getByRole("columnheader", { name: "Mean coverage" }).first(),
  ).toBeVisible();
  await expect(
    sample
      .getByRole("columnheader", { name: "Bases with coverage >100" })
      .first(),
  ).toBeVisible();
  await expect(
    sample.getByText("Mean coverage does not exceed the threshold").first(),
  ).toBeVisible();
  await controls
    .locator(":scope > details > summary", {
      hasText: /Gathering data\.\.\. \(\d+\)/,
    })
    .click();
  const control = controls
    .locator("details")
    .filter({
      has: page.getByText("Reference_control · barcode01", { exact: true }),
    })
    .last();
  await control.locator(":scope > summary").click();
  await expect(
    control.getByText(/of 10 available amplicons passed/),
  ).toBeVisible();
});

test("adapts overview columns and status groups to available space", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Change workspace" }).click();
  await page.getByRole("menuitem", { name: "Choose folder…" }).click();
  await page.getByRole("link", { name: "Experiments" }).click();
  await page.getByRole("button", { name: "experiment-001" }).click();
  const samples = page.getByRole("region", { name: "Samples", exact: true });
  const controls = page.getByRole("region", { name: "Controls", exact: true });
  await expect(samples.locator("details[open]")).toHaveCount(0);
  await expect(controls.locator("details[open]")).toHaveCount(0);
  const sampleWide = await samples.boundingBox();
  const controlWide = await controls.boundingBox();
  expect(sampleWide).not.toBeNull();
  expect(controlWide).not.toBeNull();
  if (!sampleWide || !controlWide) throw new Error("Missing overview sections");
  expect(controlWide.x).toBeGreaterThan(sampleWide.x + sampleWide.width - 1);
  expect(Math.abs(controlWide.y - sampleWide.y)).toBeLessThan(1);
  await expect(controls).toHaveCSS("border-left-style", "solid");

  const group = samples.locator(":scope > details > summary").first();
  await group.focus();
  await page.keyboard.press("Enter");
  await expect(group.locator("..")).toHaveAttribute("open", "");
  await page.keyboard.press("Enter");
  await expect(group.locator("..")).not.toHaveAttribute("open", "");

  await page.setViewportSize({ width: 600, height: 900 });
  const sampleNarrow = await samples.boundingBox();
  const controlNarrow = await controls.boundingBox();
  if (!sampleNarrow || !controlNarrow)
    throw new Error("Missing overview sections");
  expect(controlNarrow.y).toBeGreaterThanOrEqual(
    sampleNarrow.y + sampleNarrow.height,
  );
  await expect(controls).toHaveCSS("border-top-style", "solid");
});
