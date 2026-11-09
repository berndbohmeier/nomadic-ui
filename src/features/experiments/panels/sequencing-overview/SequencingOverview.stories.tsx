import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import type {
  BarcodeMetadata,
  RegionCoverageRow,
} from "../../../../backend/contract";
import { SequencingOverview } from "./SequencingOverview";
import { summarizeSequencingOverview } from "./summarizeSequencingOverview";

const metadata: BarcodeMetadata[] = [
  { barcode: "sample", sampleId: "Sample A", sampleType: "sample" },
  { barcode: "negative", sampleId: "NTC", sampleType: "negative" },
  { barcode: "positive", sampleId: "Positive", sampleType: "positive" },
  { barcode: "missing", sampleId: "Missing", sampleType: "sample" },
];
const row = (
  barcode: string,
  name: string,
  mean_cov: number,
  cov_gr100_per: number,
): RegionCoverageRow => ({
  barcode,
  name,
  mean_cov,
  cov_gr100_per,
  chrom: "chr",
  start: 0,
  end: 100,
  length: 100,
  total_cov: 0,
  cov_gr100: 0,
  n_reads: 0,
});
const data = summarizeSequencingOverview(
  [
    row("sample", "amp-A", 101, 96),
    row("sample", "amp-B", 100, 95),
    row("negative", "amp-A", 51, 0),
    row("negative", "amp-B", 0, 0),
    row("positive", "amp-A", 101, 96),
    row("positive", "amp-B", 100, 95),
  ],
  metadata,
  metadata.map((item) => item.barcode),
);

const meta = {
  title: "Experiments/Sequencing overview/Overview",
  component: SequencingOverview,
  args: data,
} satisfies Meta<typeof SequencingOverview>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Statuses: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const samples = within(canvas.getByRole("region", { name: "Samples" }));
    const controls = within(canvas.getByRole("region", { name: "Controls" }));
    await expect(
      samples.getByText("Sample A · sample", { selector: "span" }),
    ).not.toBeVisible();
    await expect(controls.getByText("NTC · negative")).not.toBeVisible();
    await userEvent.click(
      samples.getByText("Gathering data... (1)", { selector: "summary" }),
    );
    await userEvent.click(
      canvas.getByText("Sample A · sample", { selector: "span" }),
    );
    const reason = canvas.getByRole("cell", {
      name: /Mean coverage does not exceed the threshold/,
    });
    await expect(reason).toBeVisible();
    await expect(reason).toHaveTextContent(
      "Covered bases do not exceed the threshold",
    );
    await userEvent.click(
      controls.getByText("Contaminated (1)", { selector: "summary" }),
    );
    await userEvent.click(canvas.getByText("NTC · negative"));
    await expect(canvas.getByRole("cell", { name: "51" })).toBeVisible();
    await expect(canvas.getAllByText("Contaminated (1)")).toHaveLength(2);
    await userEvent.click(
      controls.getByText("Gathering data... (1)", { selector: "summary" }),
    );
    await userEvent.click(canvas.getByText("Positive · positive"));
    await expect(
      canvas.getByText("1 of 2 available amplicons passed"),
    ).toBeVisible();
    await userEvent.click(
      samples.getByText("Unavailable (1)", { selector: "summary" }),
    );
    await userEvent.click(canvas.getByText("Missing · missing"));
    await expect(
      canvas.getByText("No coverage rows are available for this barcode."),
    ).toBeVisible();
    await userEvent.click(
      samples.getByText("Gathering data... (1)", { selector: "summary" }),
    );
    await expect(
      samples.getByText("Sample A · sample", { selector: "span" }),
    ).not.toBeVisible();
  },
};

export const Empty: Story = { args: { samples: [], controls: [] } };
