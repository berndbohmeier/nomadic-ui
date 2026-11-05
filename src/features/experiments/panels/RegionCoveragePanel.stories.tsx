import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { BarcodeSelectionProvider } from "../barcodes/BarcodeSelection";
import { RegionCoveragePanel } from "./RegionCoveragePanel";

const meta = {
  title: "Experiments/Region coverage/Panel",
  component: RegionCoveragePanel,
  decorators: [
    (Story) => (
      <BarcodeSelectionProvider experimentPath="/data/results/experiment">
        <Story />
      </BarcodeSelectionProvider>
    ),
  ],
  args: {
    experiment: {
      path: "/data/results/experiment",
      name: "experiment",
      settings: null,
      files: ["summary.region_coverage.csv"],
    },
    file: "summary.region_coverage.csv",
  },
} satisfies Meta<typeof RegionCoveragePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /NTC_2.*barcode47/ }),
    );
    await expect(canvas.getByRole("status")).toHaveTextContent("NTC_2");
    await expect(canvas.getByRole("status")).toHaveTextContent("barcode47");
  },
};

export const Loading: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: { loadRegionCoverage: () => new Promise(() => {}) },
      },
    },
  },
};

export const Empty: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: {
          loadRegionCoverage: () => Promise.resolve([]),
          loadMetadata: () => Promise.resolve([]),
        },
      },
    },
  },
};

export const LoadError: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: {
          loadRegionCoverage: () => Promise.reject(new Error("Invalid CSV")),
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("alert"),
    ).toHaveTextContent("Invalid CSV");
  },
};
