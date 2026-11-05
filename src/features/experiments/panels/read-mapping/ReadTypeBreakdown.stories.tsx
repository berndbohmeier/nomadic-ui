import type { Meta, StoryObj } from "@storybook/react-vite";
import { useTranslation } from "react-i18next";
import { ReadTypeBreakdown } from "./ReadTypeBreakdown";

const meta = {
  title: "Experiments/Read mapping/Read type breakdown",
  component: ReadTypeBreakdown,
  render: function Render(args) {
    const { t } = useTranslation();
    const labels = {
      n_primary: t("experiments.readMapping.primary"),
      n_secondary: t("experiments.readMapping.secondary"),
      n_supplementary: t("experiments.readMapping.supplementary"),
      n_unmapped: t("experiments.readMapping.unmapped"),
    };
    return (
      <ReadTypeBreakdown
        {...args}
        label={t("experiments.readMapping.aggregateComposition")}
        series={args.series.map((item) => ({
          ...item,
          label: labels[item.name],
        }))}
      />
    );
  },
  args: {
    counts: {
      n_total: 1000,
      n_mapped: 800,
      n_primary: 600,
      n_secondary: 150,
      n_supplementary: 50,
      n_unmapped: 200,
    },
    series: [
      { name: "n_primary", label: "Primary", color: "blue.8" },
      { name: "n_secondary", label: "Secondary", color: "blue.4" },
      { name: "n_supplementary", label: "Supplementary", color: "blue.2" },
      { name: "n_unmapped", label: "Unmapped", color: "gray.4" },
    ],
    variant: "pie",
    label: "Read type breakdown",
  },
} satisfies Meta<typeof ReadTypeBreakdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pie: Story = {};
export const SampleBar: Story = { args: { variant: "bar" } };
export const NoReads: Story = {
  args: {
    counts: {
      n_total: 0,
      n_mapped: 0,
      n_primary: 0,
      n_secondary: 0,
      n_supplementary: 0,
      n_unmapped: 0,
    },
  },
};
