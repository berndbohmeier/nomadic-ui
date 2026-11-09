import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { metadataData } from "../../../../backend/mock/read-mapping";
import { regionCoverageData } from "../../../../backend/mock/region-coverage";
import { summarizeSequencingOverview } from "./summarizeSequencingOverview";
import { SampleVisualizations } from "./SampleVisualizations";

const samples = summarizeSequencingOverview(regionCoverageData, metadataData, [
  "barcode02",
  "barcode03",
  "barcode04",
]).samples;
const meta = {
  title: "Experiments/Sequencing overview/Sample visualizations",
  component: SampleVisualizations,
  args: { samples },
} satisfies Meta<typeof SampleVisualizations>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Overall sample statuses")).toBeVisible();
  },
};

export const Unavailable: Story = {
  args: {
    samples: summarizeSequencingOverview([], metadataData, ["barcode02"])
      .samples,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Unavailable: 1")).toBeVisible();
  },
};
