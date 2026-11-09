import type { Meta, StoryObj } from "@storybook/react-vite";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { expect, waitFor, within } from "storybook/test";
import { regionCoverageData } from "../../../backend/mock/region-coverage";
import { BarcodeSelectionProvider } from "../barcodes/BarcodeSelection";
import { SequencingOverviewPanel } from "./SequencingOverviewPanel";

const meta = {
  title: "Experiments/Sequencing overview/Panel",
  component: SequencingOverviewPanel,
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
} satisfies Meta<typeof SequencingOverviewPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {};
export const Loading: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: { loadRegionCoverage: () => new Promise(() => {}) },
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

export const MetadataError: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: {
          loadMetadata: () =>
            Promise.reject(new Error("METADATA_CSV_NOT_FOUND")),
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole("alert");
    await expect(alert).toHaveTextContent(
      "No CSV file was found in the metadata folder.",
    );
    await expect(
      within(alert).getByRole("button", { name: "Try again" }),
    ).toBeVisible();
  },
};

function SeedCoverage({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  useState(() => {
    client.setQueryData(
      ["experiment", "/data/results/experiment", "regionCoverage"],
      regionCoverageData,
    );
  });
  return children;
}

export const StaleData: Story = {
  decorators: [
    (Story) => (
      <SeedCoverage>
        <Story />
      </SeedCoverage>
    ),
  ],
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
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Showing the last loaded data.",
    );
    await expect(
      canvas.getByRole("region", { name: "Samples" }).querySelector("summary"),
    ).toBeVisible();
  },
};

export const LiveUpdates: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: {
          loadMetadata: () =>
            Promise.resolve([
              {
                barcode: "barcode02",
                sampleId: "Live sample",
                sampleType: "sample",
              },
            ]),
          loadRegionCoverage: (() => {
            let calls = 0;
            return () => {
              calls += 1;
              return Promise.resolve(
                regionCoverageData
                  .filter((row) => row.barcode === "barcode02")
                  .map((row) => ({
                    ...row,
                    mean_cov: calls === 1 ? 0 : 150,
                    cov_gr100_per: calls === 1 ? 0 : 99,
                  })),
              );
            };
          })(),
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const samples = within(
      await canvas.findByRole("region", { name: "Samples" }),
    );
    await expect(samples.getByText("No data (1)")).toBeVisible();
    await expect(samples.getByText("No data: 1")).toBeVisible();
    await waitFor(
      async () => {
        await expect(samples.getByText("Complete (1)")).toBeVisible();
        await expect(samples.getByText("Complete: 1")).toBeVisible();
      },
      { timeout: 8000 },
    );
  },
};

export const MostlyNoData: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: {
          loadMetadata: () =>
            Promise.resolve([
              {
                barcode: "barcode02",
                sampleId: "Mostly empty",
                sampleType: "sample",
              },
            ]),
          loadRegionCoverage: () =>
            Promise.resolve(
              regionCoverageData
                .filter((row) => row.barcode === "barcode02")
                .slice(0, 6)
                .map((row, index) => ({
                  ...row,
                  mean_cov: index === 0 ? 150 : 4.99,
                  cov_gr100_per: 99,
                })),
            ),
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const samples = within(
      await canvas.findByRole("region", { name: "Samples" }),
    );
    await expect(samples.getByText("No data (1)")).toBeVisible();
    await expect(samples.getByText("No data: 1")).toBeVisible();
    await expect(samples.getByText(/Sample No data: > 80%/)).toBeVisible();
  },
};
