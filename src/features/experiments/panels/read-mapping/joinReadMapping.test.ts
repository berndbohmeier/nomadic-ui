import { describe, expect, it } from "vitest";
import type {
  BarcodeMetadata,
  ReadMappingCounts,
} from "../../../../backend/contract";
import { joinReadMapping } from "./joinReadMapping";

const counts = (barcode: string, n: number): ReadMappingCounts => ({
  barcode,
  n_total: n,
  n_mapped: n,
  n_primary: n,
  n_secondary: 0,
  n_supplementary: 0,
  n_unmapped: 0,
});

const metadata: BarcodeMetadata[] = [
  { barcode: "barcode01", sampleId: "A", sampleType: "positive" },
  { barcode: "barcode02", sampleId: "", sampleType: "sample" },
  { barcode: "barcode03", sampleId: "NTC", sampleType: "negative" },
];

describe("joinReadMapping", () => {
  it("returns selected barcodes in selection order and keeps unclassified first", () => {
    const rows = joinReadMapping(
      [
        counts("barcode01", 1),
        counts("unclassified", 9),
        counts("barcode02", 2),
      ],
      metadata,
      ["barcode02", "barcode01"],
    );
    expect(rows.map((row) => row.barcode)).toEqual([
      "unclassified",
      "barcode02",
      "barcode01",
    ]);
    expect(rows[2]).toMatchObject({
      sampleId: "A",
      sampleType: "positive",
      n_total: 1,
    });
  });

  it("zero-fills barcodes without reads and falls back to the barcode as name", () => {
    const rows = joinReadMapping([], metadata, ["barcode02", "barcode03"]);
    expect(rows[0]).toMatchObject({ sampleId: "barcode02", n_total: 0 });
    expect(rows[1]).toMatchObject({ sampleId: "NTC", sampleType: "negative" });
  });

  it("ignores barcodes that are not in the metadata", () => {
    const rows = joinReadMapping([counts("barcode99", 5)], metadata, [
      "barcode99",
    ]);
    expect(rows).toEqual([]);
  });
});
