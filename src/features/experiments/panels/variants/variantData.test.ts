import { describe, expect, it } from "vitest";
import type {
  AaChangeRow,
  BarcodeMetadata,
} from "../../../../backend/contract";
import { variantMatrix } from "./variantData";

const metadata: BarcodeMetadata[] = [
  { barcode: "barcode01", sampleId: "Control", sampleType: "positive" },
  { barcode: "barcode02", sampleId: "", sampleType: "negative" },
  { barcode: "unclassified", sampleId: "unclassified", sampleType: "sample" },
];
const row: AaChangeRow = {
  barcode: "barcode01",
  gene: "dhfr",
  aa_change: "N51I",
  aa_call: "wt",
  aa_depth: 0,
  aa_wsaf: 0,
};

describe("variantMatrix", () => {
  it("uses all file variants, selected metadata order and preserves missing calls", () => {
    const result = variantMatrix(
      [
        row,
        {
          ...row,
          barcode: "barcode03",
          gene: "crt",
          aa_change: "K76T",
          aa_call: "mutant",
          aa_depth: null,
          aa_wsaf: null,
        },
        { ...row, barcode: "Unclassified", gene: "hidden" },
      ],
      metadata,
      ["barcode02", "unclassified", "barcode01", "unknown"],
    );
    expect(result.variants.map(({ gene }) => gene)).toEqual(["dhfr", "crt"]);
    expect(result.samples.map(({ barcode }) => barcode)).toEqual([
      "barcode02",
      "barcode01",
    ]);
    expect(result.samples[0]).toMatchObject({
      sampleId: "barcode02",
      sampleType: "negative",
      calls: {},
    });
    expect(result.samples[1].calls[result.variants[0].id]).toEqual({
      status: "wt",
      depth: 0,
      wsaf: 0,
    });
    expect(result.samples[1].calls[result.variants[1].id]).toBeUndefined();
  });

  it("keeps the variant universe when no samples are selected", () => {
    expect(variantMatrix([row], metadata, [])).toEqual({
      variants: [
        { id: JSON.stringify(["dhfr", "N51I"]), gene: "dhfr", change: "N51I" },
      ],
      samples: [],
    });
  });
});
