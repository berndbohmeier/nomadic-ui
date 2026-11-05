import { describe, expect, it } from "vitest";
import type { ReadMappingDatum } from "../../../../backend/contract";
import { summarizeReadMapping } from "./summarizeReadMapping";

const rows: ReadMappingDatum[] = [
  {
    barcode: "unclassified",
    sampleId: "unclassified",
    sampleType: "sample",
    n_total: 1000,
    n_mapped: 200,
    n_primary: 150,
    n_secondary: 30,
    n_supplementary: 20,
    n_unmapped: 800,
  },
  {
    barcode: "barcode01",
    sampleId: "A",
    sampleType: "sample",
    n_total: 100,
    n_mapped: 80,
    n_primary: 50,
    n_secondary: 20,
    n_supplementary: 10,
    n_unmapped: 20,
  },
  {
    barcode: "barcode02",
    sampleId: "B",
    sampleType: "sample",
    n_total: 900,
    n_mapped: 840,
    n_primary: 810,
    n_secondary: 20,
    n_supplementary: 10,
    n_unmapped: 60,
  },
];

describe("read mapping summaries", () => {
  it("divides total unclassified reads by all run reads, including unclassified", () => {
    const summary = summarizeReadMapping(rows);
    expect(summary.barcodes.map((row) => row.barcode)).toEqual([
      "barcode01",
      "barcode02",
    ]);
    expect(summary.allReads).toBe(2000);
    expect(summary.unclassifiedReads).toBe(1000);
    expect(summary.unclassifiedShare).toBe(0.5);
  });

  it("aggregates counts rather than averaging per-barcode percentages", () => {
    const { totals } = summarizeReadMapping(rows);
    expect(totals).toEqual({
      n_total: 1000,
      n_mapped: 920,
      n_primary: 860,
      n_secondary: 40,
      n_supplementary: 20,
      n_unmapped: 80,
    });
    expect(totals.n_primary / totals.n_total).toBe(0.86);
  });

  it("handles runs with only unclassified reads", () => {
    const summary = summarizeReadMapping([rows[0]]);
    expect(summary.barcodes).toEqual([]);
    expect(summary.totals.n_total).toBe(0);
    expect(summary.unclassifiedShare).toBe(1);
  });

  it("handles absent unclassified and zero-read runs without dividing by zero", () => {
    expect(summarizeReadMapping(rows.slice(1)).unclassifiedShare).toBe(0);
    expect(summarizeReadMapping([]).unclassifiedShare).toBeNull();
    expect(
      summarizeReadMapping([
        {
          ...rows[1],
          n_total: 0,
          n_mapped: 0,
          n_primary: 0,
          n_secondary: 0,
          n_supplementary: 0,
          n_unmapped: 0,
        },
      ]).unclassifiedShare,
    ).toBeNull();
  });
});
