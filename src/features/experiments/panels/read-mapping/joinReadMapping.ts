import type {
  BarcodeMetadata,
  ReadMappingCounts,
  ReadMappingDatum,
} from "../../../../backend/contract";

const EMPTY_COUNTS = {
  n_total: 0,
  n_mapped: 0,
  n_primary: 0,
  n_secondary: 0,
  n_supplementary: 0,
  n_unmapped: 0,
};

/**
 * Combines counts with metadata for the selected barcodes, in selection order.
 * Unclassified reads are run-wide and always kept, first in the result.
 */
export function joinReadMapping(
  counts: ReadMappingCounts[],
  metadata: BarcodeMetadata[],
  selected: string[],
): ReadMappingDatum[] {
  const countsByBarcode = new Map(counts.map((row) => [row.barcode, row]));
  const metadataByBarcode = new Map(metadata.map((row) => [row.barcode, row]));

  const unclassified = counts
    .filter((row) => row.barcode.trim().toLowerCase() === "unclassified")
    .map((row) => ({
      ...row,
      sampleId: row.barcode,
      sampleType: "sample" as const,
    }));

  const rows = selected.flatMap((barcode) => {
    const sample = metadataByBarcode.get(barcode);
    if (sample === undefined) return [];
    return [
      {
        ...EMPTY_COUNTS,
        ...countsByBarcode.get(barcode),
        ...sample,
        // Display falls back to the barcode when the sample has no id.
        sampleId: sample.sampleId || barcode,
      },
    ];
  });

  return [...unclassified, ...rows];
}
