import type { Meta, StoryObj } from "@storybook/react-vite";
import { metadataData } from "../../../../backend/mock/read-mapping";
import { regionCoverageData } from "../../../../backend/mock/region-coverage";
import { RegionCoverageChart } from "./RegionCoverageChart";

const meta = {
  title: "Experiments/Region coverage/Chart",
  component: RegionCoverageChart,
  args: {
    data: regionCoverageData,
    metadata: metadataData,
    selectedBarcodes: metadataData.map((row) => row.barcode),
  },
} satisfies Meta<typeof RegionCoverageChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OneBarcode: Story = {
  args: { selectedBarcodes: ["barcode01"] },
};

export const Empty: Story = {
  args: { data: [] },
};
