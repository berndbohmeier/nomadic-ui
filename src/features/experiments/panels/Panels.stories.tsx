import type { Meta, StoryObj } from "@storybook/react-vite";
import { AAChangePanel } from "./AAChangePanel";
import { BarcodeSelectionProvider } from "../barcodes/BarcodeSelection";
import { ReadMappingPanel } from "./ReadMappingPanel";
import { RegionCoveragePanel } from "./RegionCoveragePanel";

const experiment = {
  path: "/data/results/exp",
  name: "exp",
  settings: null,
  files: [],
};

const meta = {
  title: "Experiments/Panels",
  component: ReadMappingPanel,
  decorators: [
    (Story) => (
      <BarcodeSelectionProvider experimentPath={experiment.path}>
        <Story />
      </BarcodeSelectionProvider>
    ),
  ],
  args: { experiment, file: "summary.read_mapping.csv" },
} satisfies Meta<typeof ReadMappingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadMapping: Story = {};
export const RegionCoverage: Story = {
  render: (args) => (
    <RegionCoveragePanel {...args} file="summary.region_coverage.csv" />
  ),
};
export const AAChange: Story = {
  render: (args) => <AAChangePanel {...args} file="summary.aa_changes.csv" />,
};
export const AAChangeLegacyFile: Story = {
  render: (args) => <AAChangePanel {...args} file="summary.variants.csv" />,
};
