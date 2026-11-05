import type {
  BarcodeMetadata,
  ReadMappingCounts,
  ReadMappingDatum,
} from "../contract";

/** In-memory browser data; native experiment CSVs are loaded with Polars. */
export const unclassifiedReadMapping: ReadMappingDatum = {
  barcode: "unclassified",
  sampleId: "unclassified",
  sampleType: "sample",
  n_total: 12000,
  n_mapped: 3000,
  n_primary: 2500,
  n_secondary: 300,
  n_supplementary: 200,
  n_unmapped: 9000,
};

export const readMappingData: ReadMappingDatum[] = [
  unclassifiedReadMapping,
  ...Array.from({ length: 48 }, (_, index): ReadMappingDatum => {
    const negative = index >= 45;
    const barcode = `barcode${String(index + 1).padStart(2, "0")}`;
    const n_total = negative
      ? [277, 314, 513][index - 45]
      : 7000 + ((index * 137) % 6000);
    const n_mapped = negative
      ? [0, 3, 1][index - 45]
      : index === 2
        ? 0
        : Math.floor(n_total * 0.85);
    const n_secondary = negative
      ? 0
      : Math.floor(n_mapped * (index === 3 ? 0.6 : 0.012));
    const n_supplementary = negative
      ? 0
      : Math.floor(n_mapped * (index === 3 ? 0.15 : 0.004));
    return {
      barcode,
      sampleId: negative
        ? `NTC_${index - 44}`
        : index === 0
          ? "Reference_control"
          : `Sample_${String(index + 1).padStart(2, "0")}`,
      sampleType: negative ? "negative" : index === 0 ? "positive" : "sample",
      n_total,
      n_mapped,
      n_primary: n_mapped - n_secondary - n_supplementary,
      n_secondary,
      n_supplementary,
      n_unmapped: n_total - n_mapped,
    };
  }),
];

export const metadataData: BarcodeMetadata[] = readMappingData
  .filter((row) => row !== unclassifiedReadMapping)
  .map(({ barcode, sampleId, sampleType }) => ({
    barcode,
    sampleId,
    sampleType,
  }));

export const readMappingCountsData: ReadMappingCounts[] = readMappingData.map(
  (row) => ({
    barcode: row.barcode,
    n_total: row.n_total,
    n_mapped: row.n_mapped,
    n_primary: row.n_primary,
    n_secondary: row.n_secondary,
    n_supplementary: row.n_supplementary,
    n_unmapped: row.n_unmapped,
  }),
);
