import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { metadataData } from "../../../../backend/mock/read-mapping";
import { regionCoverageData } from "../../../../backend/mock/region-coverage";
import { summarizeSequencingOverview } from "./summarizeSequencingOverview";
import { ControlSummary } from "./ControlSummary";

const controls = summarizeSequencingOverview(regionCoverageData, metadataData, [
  "barcode01",
  "barcode46",
]).controls;
const meta = {
  title: "Experiments/Sequencing overview/Control summary",
  component: ControlSummary,
  args: { controls },
} satisfies Meta<typeof ControlSummary>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Mixed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Positive controls passed")).toBeVisible();
    await expect(canvas.getByText("Negative controls passed")).toBeVisible();
    await expect(canvas.getByText("0 / 1")).toBeVisible();
    const positive = canvas.getByText("Positive controls passed").parentElement;
    const negative = canvas.getByText("Negative controls passed").parentElement;
    if (!positive || !negative) throw new Error("Missing control counts");
    const probe = document.createElement("span");
    positive.append(probe);
    probe.style.color = "var(--mantine-color-green-7)";
    const green = getComputedStyle(probe).color;
    probe.remove();
    await expect(
      getComputedStyle(within(positive).getByText("0 / 1")).color,
    ).not.toBe(green);
    await expect(within(negative).getByText("1 / 1")).toHaveStyle({
      color: green,
    });
  },
};
export const None: Story = {
  args: { controls: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("No positive controls selected"),
    ).toBeVisible();
    await expect(
      canvas.getByText("No negative controls selected"),
    ).toBeVisible();
  },
};

export const PassedAndContaminated: Story = {
  args: {
    controls: controls.map((control) => ({
      ...control,
      status: control.sampleType === "positive" ? "passed" : "contaminated",
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const positive = canvas.getByText("Positive controls passed").parentElement;
    const negative = canvas.getByText("Negative controls passed").parentElement;
    if (!positive || !negative) throw new Error("Missing control counts");
    const positiveCount = within(positive).getByText("1 / 1");
    const negativeCount = within(negative).getByText("0 / 1");
    const probe = document.createElement("span");
    positive.append(probe);
    probe.style.color = "var(--mantine-color-green-7)";
    const green = getComputedStyle(probe).color;
    probe.style.color = "var(--mantine-color-red-7)";
    const red = getComputedStyle(probe).color;
    probe.remove();
    await expect(positiveCount).toHaveStyle({ color: green });
    await expect(negativeCount).toHaveStyle({ color: red });
  },
};

export const UnavailableNegative: Story = {
  args: {
    controls: controls
      .filter((control) => control.sampleType === "negative")
      .map((control) => ({ ...control, status: "unavailable" })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const negative = canvas.getByText("Negative controls passed").parentElement;
    if (!negative) throw new Error("Missing negative control count");
    const probe = document.createElement("span");
    negative.append(probe);
    probe.style.color = "var(--mantine-color-green-7)";
    const green = getComputedStyle(probe).color;
    probe.style.color = "var(--mantine-color-red-7)";
    const red = getComputedStyle(probe).color;
    probe.remove();
    const color = getComputedStyle(within(negative).getByText("0 / 1")).color;
    await expect(color).not.toBe(green);
    await expect(color).not.toBe(red);
  },
};

export const PassedAndContaminatedNegatives: Story = {
  args: {
    controls: [
      ...controls.filter((control) => control.sampleType === "negative"),
      ...controls
        .filter((control) => control.sampleType === "negative")
        .map((control) => ({
          ...control,
          barcode: "other",
          status: "contaminated" as const,
        })),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const negative = canvas.getByText("Negative controls passed").parentElement;
    if (!negative) throw new Error("Missing negative control count");
    const probe = document.createElement("span");
    negative.append(probe);
    probe.style.color = "var(--mantine-color-red-7)";
    const red = getComputedStyle(probe).color;
    probe.remove();
    await expect(within(negative).getByText("1 / 2")).toHaveStyle({
      color: red,
    });
  },
};
