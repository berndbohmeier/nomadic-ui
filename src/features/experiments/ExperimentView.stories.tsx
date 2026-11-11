import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { ExperimentView } from "./ExperimentView";

const base = {
  path: "/data/results/2025_07_28_new_dbs",
  name: "2025_07_28_new_dbs",
  settings: {
    startDate: "2025-07-28T14:54:21+00:00",
    caller: "delve",
    referenceName: "Pf3D7",
    nBarcodes: 48,
    nRegions: 10,
  },
};

const meta = {
  title: "Experiments/ExperimentView",
  component: ExperimentView,
} satisfies Meta<typeof ExperimentView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllPanels: Story = {
  args: {
    experiment: {
      ...base,
      files: [
        "summary.read_mapping.csv",
        "summary.region_coverage.csv",
        "summary.aa_changes.csv",
      ],
    },
  },
};
const openFolder = fn(() => Promise.resolve());
export const OpenExperimentFolder: Story = {
  args: {
    experiment: { ...base, files: [] },
  },
  parameters: {
    testProviders: {
      backend: { experiments: { openFolder } },
    },
  },
  play: async ({ canvasElement }) => {
    openFolder.mockClear();
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Open experiment folder in file explorer",
      }),
    );
    await expect(openFolder).toHaveBeenCalledWith(base.path);
  },
};
export const SlowAminoAcidLoading: Story = {
  args: {
    experiment: {
      ...base,
      files: ["summary.read_mapping.csv", "summary.aa_changes.csv"],
    },
  },
  parameters: {
    testProviders: {
      backend: {
        experiments: { loadAaChanges: () => new Promise(() => {}) },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tab = canvas.getByRole("tab", { name: "AA changes" });
    await userEvent.click(tab);
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(
      await canvas.findByRole("status", { name: "Loading amino-acid changes" }),
    ).toBeVisible();
  },
};
export const SomePanels: Story = {
  args: {
    experiment: { ...base, files: ["summary.region_coverage.csv"] },
  },
};
export const NoPanelsNoSettings: Story = {
  args: { experiment: { ...base, settings: null, files: [] } },
};
