import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { ReadMappingChart } from "./ReadMappingChart";
import type { ReadMappingDatum } from "../../../../backend/contract";
import { unclassifiedReadMapping } from "../../../../backend/mock/read-mapping";
import i18n from "../../../../i18n";
import mappingCsv from "../../../../../test_data/nomadic/results/2025_07_28_new_dbs/summary.read_mapping.csv?raw";
import metadataCsv from "../../../../../test_data/nomadic/results/2025_07_28_new_dbs/metadata/samples.csv?raw";

// Fixed, unquoted CSV fixtures, parsed here only for Storybook.
function fixtureRows(csv: string): Record<string, string>[] {
  const [header, ...lines] = csv.trim().split(/\r?\n/);
  const columns = header.split(",");
  return lines.map((line) =>
    Object.fromEntries(
      line.split(",").map((value, index) => [columns[index], value]),
    ),
  );
}

const metadata = fixtureRows(metadataCsv);
const exampleData: ReadMappingDatum[] = fixtureRows(mappingCsv).map((row) => {
  const sample = metadata.find((item) => item.barcode === row.barcode);
  return {
    barcode: row.barcode,
    sampleId: sample?.sample_id ?? row.barcode,
    sampleType:
      sample?.sample_type === "neg"
        ? "negative"
        : sample?.sample_type === "pos"
          ? "positive"
          : "sample",
    n_total: Number(row.n_total),
    n_mapped: Number(row.n_mapped),
    n_primary: Number(row.n_primary),
    n_secondary: Number(row.n_secondary),
    n_supplementary: Number(row.n_supplementary),
    n_unmapped: Number(row.n_unmapped),
  };
});

const screeningData: ReadMappingDatum[] = [
  {
    barcode: "barcode01",
    sampleId: "Reference control",
    sampleType: "positive",
    n_total: 10000,
    n_mapped: 7800,
    n_primary: 7600,
    n_secondary: 150,
    n_supplementary: 50,
    n_unmapped: 2200,
  },
  {
    barcode: "barcode02",
    sampleId: "Sample 02",
    sampleType: "sample",
    n_total: 8000,
    n_mapped: 7250,
    n_primary: 7000,
    n_secondary: 150,
    n_supplementary: 100,
    n_unmapped: 750,
  },
  {
    barcode: "barcode03",
    sampleId: "Sample 03",
    sampleType: "sample",
    n_total: 6000,
    n_mapped: 0,
    n_primary: 0,
    n_secondary: 0,
    n_supplementary: 0,
    n_unmapped: 6000,
  },
  {
    barcode: "barcode04",
    sampleId: "Sample 04",
    sampleType: "sample",
    n_total: 9000,
    n_mapped: 7200,
    n_primary: 1800,
    n_secondary: 4200,
    n_supplementary: 1200,
    n_unmapped: 1800,
  },
  {
    barcode: "barcode05",
    sampleId: "NTC 01",
    sampleType: "negative",
    n_total: 300,
    n_mapped: 0,
    n_primary: 0,
    n_secondary: 0,
    n_supplementary: 0,
    n_unmapped: 300,
  },
  {
    barcode: "barcode06",
    sampleId: "NTC 02",
    sampleType: "negative",
    n_total: 1800,
    n_mapped: 1550,
    n_primary: 1500,
    n_secondary: 40,
    n_supplementary: 10,
    n_unmapped: 250,
  },
  {
    barcode: "barcode07",
    sampleId: "Sample 07",
    sampleType: "sample",
    n_total: 400,
    n_mapped: 350,
    n_primary: 320,
    n_secondary: 20,
    n_supplementary: 10,
    n_unmapped: 50,
  },
  {
    barcode: "barcode08",
    sampleId: "Sample 08",
    sampleType: "sample",
    n_total: 0,
    n_mapped: 0,
    n_primary: 0,
    n_secondary: 0,
    n_supplementary: 0,
    n_unmapped: 0,
  },
];

const meta = {
  title: "Experiments/Read mapping/Chart",
  component: ReadMappingChart,
  args: {
    data: screeningData,
    initialBarcode: "barcode04",
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ReadMappingChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ScreeningExamples: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("combobox")).not.toBeInTheDocument();

    await userEvent.click(
      await canvas.findByRole("button", { name: /NTC 02.*barcode06/ }),
    );
    await expect(canvas.getByRole("status")).toHaveTextContent("NTC 02");

    // A barcode without a visible bar must remain selectable from the chart.
    const noReads = canvas.getByRole("button", {
      name: /Sample 08.*barcode08/,
    });
    await userEvent.click(noReads);
    await expect(canvas.getByRole("status")).toHaveTextContent("Sample 08");
    const zeroDetails = within(canvas.getByRole("status"));
    await expect(
      zeroDetails.getByText(i18n.t("experiments.readMapping.mapped"))
        .nextElementSibling,
    ).toHaveTextContent(
      `0 (${i18n.t("experiments.readMapping.notApplicable")})`,
    );
    await expect(
      zeroDetails.getByText(i18n.t("experiments.readMapping.primaryMapped"))
        .nextElementSibling,
    ).toHaveTextContent(
      `0 (${i18n.t("experiments.readMapping.notApplicable")})`,
    );

    await userEvent.click(
      canvas.getByRole("button", { name: /NTC 02.*barcode06/ }),
    );
    noReads.focus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("status")).toHaveTextContent("Sample 08");

    await userEvent.click(
      canvas.getByRole("button", { name: /Sample 04.*barcode04/ }),
    );
  },
};
export const With48Barcodes: Story = {
  args: { data: exampleData, initialBarcode: "barcode47" },
};
export const Empty: Story = { args: { data: [] } };

export const WithUnclassified: Story = {
  args: {
    data: [unclassifiedReadMapping, ...screeningData],
    initialBarcode: "unclassified",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole("button", { name: /unclassified/i }),
    ).not.toBeInTheDocument();
    await expect(canvas.getAllByRole("button")).toHaveLength(
      screeningData.length,
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Reference control",
    );
    const allReads =
      12000 + screeningData.reduce((sum, row) => sum + row.n_total, 0);
    await expect(canvas.getByTestId("unclassified-share")).toHaveTextContent(
      (12000 / allReads).toLocaleString(i18n.language, {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: /Sample 04.*barcode04/ }),
    );
    const details = within(canvas.getByRole("status"));
    const percent = (value: number) =>
      value.toLocaleString(i18n.language, {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    await expect(
      details.getByText(i18n.t("experiments.readMapping.total"))
        .nextElementSibling,
    ).toHaveTextContent((9000).toLocaleString(i18n.language));
    await expect(
      details.getByText(i18n.t("experiments.readMapping.mapped"))
        .nextElementSibling,
    ).toHaveTextContent(
      `${(7200).toLocaleString(i18n.language)} (${percent(0.8)})`,
    );
    await expect(
      details.getByText(i18n.t("experiments.readMapping.primaryMapped"))
        .nextElementSibling,
    ).toHaveTextContent(
      `${(1800).toLocaleString(i18n.language)} (${percent(0.25)})`,
    );
  },
};

export const OnlyUnclassified: Story = {
  args: { data: [unclassifiedReadMapping] },
};
