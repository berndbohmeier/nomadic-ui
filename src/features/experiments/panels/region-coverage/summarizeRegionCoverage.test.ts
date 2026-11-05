import { describe, expect, it } from "vitest";
import type {
  BarcodeMetadata,
  RegionCoverageRow,
} from "../../../../backend/contract";
import { summarizeRegionCoverage } from "./summarizeRegionCoverage";

const metadata: BarcodeMetadata[] = [
  { barcode: "barcode01", sampleId: "A", sampleType: "positive" },
  { barcode: "barcode02", sampleId: "", sampleType: "sample" },
  { barcode: "barcode03", sampleId: "NTC", sampleType: "negative" },
];

const row = (
  barcode: string,
  name: string,
  n_reads: number,
): RegionCoverageRow => ({
  barcode,
  chrom: "chr1",
  start: 1,
  length: 100,
  end: 101,
  mean_cov: 10,
  name,
  cov_gr100_per: 0,
  total_cov: 1_000,
  cov_gr100: 0,
  n_reads,
});

describe("summarizeRegionCoverage", () => {
  it("keeps barcode selection order and aggregates each amplicon", () => {
    const summary = summarizeRegionCoverage(
      [
        row("barcode01", "amp-a", 10),
        row("barcode01", "amp-b", 20),
        row("barcode02", "amp-a", 4),
        row("barcode02", "amp-b", 6),
      ],
      metadata,
      ["barcode02", "barcode01"],
    );

    expect(summary.barcodes.map((item) => item.barcode)).toEqual([
      "barcode02",
      "barcode01",
    ]);
    expect(summary.totals.map(({ name, nReads }) => [name, nReads])).toEqual([
      ["amp-a", 14],
      ["amp-b", 26],
    ]);
    expect(summary.totalReads).toBe(40);
  });

  it("excludes unclassified completely and zero-fills missing values", () => {
    const summary = summarizeRegionCoverage(
      [
        row("unclassified", "hidden", 99),
        row("barcode01", "amp-a", 10),
        row("barcode02", "amp-b", 5),
      ],
      metadata,
      ["barcode01", "barcode02", "barcode03"],
    );

    expect(summary.amplicons.map((item) => item.name)).toEqual([
      "amp-a",
      "amp-b",
    ]);
    expect(summary.barcodes[0].counts).toEqual({ "amp-a": 10, "amp-b": 0 });
    expect(summary.barcodes[2]).toMatchObject({
      barcode: "barcode03",
      totalReads: 0,
    });
  });

  it("falls back to the barcode when a sample name is empty", () => {
    const summary = summarizeRegionCoverage([], metadata, ["barcode02"]);
    expect(summary.barcodes[0].sampleId).toBe("barcode02");
  });
});
