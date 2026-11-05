import type { ReadMappingDatum } from "../../../../backend/contract";

export type ReadCounts = Pick<
  ReadMappingDatum,
  | "n_total"
  | "n_mapped"
  | "n_primary"
  | "n_secondary"
  | "n_supplementary"
  | "n_unmapped"
>;

export type ReadTypeKey = Exclude<keyof ReadCounts, "n_total" | "n_mapped">;

export interface ReadTypeSeries {
  name: ReadTypeKey;
  label: string;
  color: string;
}

export function summarizeReadMapping(data: ReadMappingDatum[]) {
  const barcodes: ReadMappingDatum[] = [];
  const totals: ReadCounts = {
    n_total: 0,
    n_mapped: 0,
    n_primary: 0,
    n_secondary: 0,
    n_supplementary: 0,
    n_unmapped: 0,
  };
  let allReads = 0;
  let unclassifiedReads = 0;

  for (const row of data) {
    allReads += row.n_total;
    if (row.barcode.trim().toLowerCase() === "unclassified") {
      unclassifiedReads += row.n_total;
      continue;
    }
    barcodes.push(row);
    for (const key of Object.keys(totals) as (keyof ReadCounts)[]) {
      totals[key] += row[key];
    }
  }

  return {
    barcodes,
    totals,
    allReads,
    unclassifiedReads,
    unclassifiedShare: allReads > 0 ? unclassifiedReads / allReads : null,
  };
}
