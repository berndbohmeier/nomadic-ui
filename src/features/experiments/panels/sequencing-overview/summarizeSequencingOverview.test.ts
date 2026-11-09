import { describe, expect, it } from "vitest";
import type {
  BarcodeMetadata,
  RegionCoverageRow,
} from "../../../../backend/contract";
import { summarizeSequencingOverview } from "./summarizeSequencingOverview";

const metadata: BarcodeMetadata[] = [
  { barcode: "sample", sampleId: "Sample", sampleType: "sample" },
  { barcode: "neg", sampleId: "Negative", sampleType: "negative" },
  { barcode: "pos", sampleId: "Positive", sampleType: "positive" },
];
const row = (
  barcode: string,
  name: string,
  mean_cov: number,
  cov_gr100_per = 96,
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
const summarize = (
  rows: RegionCoverageRow[],
  selected = metadata.map((m) => m.barcode),
) => summarizeSequencingOverview(rows, metadata, selected);

describe("summarizeSequencingOverview", () => {
  it("uses strict sample thresholds and groups mixed amplicons", () => {
    const sample = summarize([
      row("sample", "complete", 100.01, 95.01),
      row("sample", "mean boundary", 100, 96),
      row("sample", "percentage boundary", 101, 95),
      row("sample", "no data", 4.99),
      row("sample", "no data boundary", 5),
    ]).samples[0];
    expect(sample.status).toBe("gathering");
    expect(sample.amplicons.map((a) => a.status)).toEqual([
      "complete",
      "gathering",
      "gathering",
      "noData",
      "gathering",
    ]);
    expect(summarize([row("sample", "a", 101)]).samples[0].status).toBe(
      "complete",
    );
    expect(
      summarize([row("sample", "a", 0), row("sample", "b", 0.9)]).samples[0]
        .status,
    ).toBe("noData");
  });

  it("treats a negative control as passed unless any present row exceeds 50", () => {
    expect(
      summarize([row("neg", "a", 0), row("neg", "b", 50)]).controls[0].status,
    ).toBe("passed");
    const control = summarize([row("neg", "a", 50.01), row("neg", "b", 51)])
      .controls[0];
    expect(control.status).toBe("contaminated");
    expect(control.amplicons.map((a) => a.status)).toEqual([
      "contaminated",
      "contaminated",
    ]);
  });

  it("requires strictly more than 80% of positive rows above 100", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      row("pos", String(i), i < 4 ? 101 : 100),
    );
    const control = summarize(rows).controls[1];
    expect(control.status).toBe("gathering");
    expect(control.passedCount).toBe(4);
    expect(summarize([...rows, row("pos", "6", 101)]).controls[1].status).toBe(
      "passed",
    );
    expect(summarize([row("pos", "a", 0)]).controls[1].status).toBe("noData");
    expect(summarize([row("pos", "a", 4.99)]).controls[1].status).toBe(
      "noData",
    );
    expect(summarize([row("pos", "a", 5)]).controls[1].status).toBe(
      "gathering",
    );
  });

  it("classifies samples as no data only above 80% of available amplicons", () => {
    const fourOfFive = Array.from({ length: 5 }, (_, i) =>
      row("sample", String(i), i < 4 ? 4.99 : 5),
    );
    expect(summarize(fourOfFive).samples[0].status).toBe("gathering");
    const fiveOfSix = [...fourOfFive, row("sample", "sixth", 0)];
    expect(summarize(fiveOfSix).samples[0].status).toBe("noData");
    expect(
      summarize(
        fiveOfSix.map((item, index) =>
          index === 4 ? { ...item, mean_cov: 101 } : item,
        ),
      ).samples[0].status,
    ).toBe("noData");
    expect(summarize([]).samples[0].status).toBe("unavailable");
  });

  it("uses present rows only and marks missing barcodes unavailable", () => {
    const result = summarize([row("sample", "a", 101), row("neg", "other", 0)]);
    expect(result.samples[0].status).toBe("complete");
    expect(result.controls.map((c) => c.status)).toEqual([
      "passed",
      "unavailable",
    ]);
    expect(result.controls[1].amplicons).toHaveLength(0);
  });

  it("honors selection order, handles empty selections and ignores unclassified", () => {
    const data = [row("sample", "a", 101), row("unclassified", "a", 101)];
    expect(summarize(data, []).samples).toEqual([]);
    const result = summarizeSequencingOverview(
      data,
      [
        ...metadata,
        { barcode: "unclassified", sampleId: "", sampleType: "sample" },
        { barcode: "second", sampleId: "", sampleType: "sample" },
      ],
      ["second", "sample", "unclassified", "unknown"],
    );
    expect(result.samples.map((s) => s.sampleId)).toEqual(["second", "Sample"]);
  });
});
