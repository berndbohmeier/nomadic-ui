import type { Meta, StoryObj } from "@storybook/react-vite";
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
export const SomePanels: Story = {
  args: {
    experiment: { ...base, files: ["summary.region_coverage.csv"] },
  },
};
export const NoPanelsNoSettings: Story = {
  args: { experiment: { ...base, settings: null, files: [] } },
};
