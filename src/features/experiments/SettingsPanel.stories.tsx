import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsPanel } from "./SettingsPanel";

const meta = {
  title: "Experiments/SettingsPanel",
  component: SettingsPanel,
} satisfies Meta<typeof SettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    settings: {
      startDate: "2025-07-28T14:54:21+00:00",
      caller: "delve",
      fastqDir: "/data/run/*/*/fastq_pass",
      metadataCsv: "/data/metadata.csv",
      regionBed: "/data/amplicons.bed",
      referenceName: "Pf3D7",
      nBarcodes: 48,
      nRegions: 10,
      minknowDir: "/data/run",
    },
  },
};
export const Partial: Story = { args: { settings: { caller: "delve" } } };
export const Missing: Story = { args: { settings: null } };
