import type {
  BarcodeMetadata,
  RegionCoverageRow,
} from "../../../../backend/contract";

const COLORS = [
  "blue.7",
  "cyan.6",
  "teal.6",
  "green.6",
  "lime.7",
  "yellow.7",
  "orange.6",
  "red.6",
  "pink.6",
  "grape.6",
  "violet.6",
  "indigo.6",
] as const;

export interface AmpliconSeries {
  name: string;
  key: string;
  color: string;
}

export interface BarcodeCoverage extends BarcodeMetadata {
  counts: Record<string, number>;
  totalReads: number;
}

export interface AmpliconTotal extends AmpliconSeries {
  nReads: number;
}

/** Builds every panel view from the selected barcodes in their shared order. */
export function summarizeRegionCoverage(
  data: RegionCoverageRow[],
  metadata: BarcodeMetadata[],
  selected: string[],
) {
  const rows = data.filter(
    (row) => row.barcode.trim().toLowerCase() !== "unclassified",
  );
  const names = Array.from(new Set(rows.map((row) => row.name)));
  const amplicons: AmpliconSeries[] = names.map((name, index) => ({
    name,
    key: `amplicon_${index}`,
    color: COLORS[index % COLORS.length],
  }));
  const metadataByBarcode = new Map(metadata.map((row) => [row.barcode, row]));
  const countsByBarcode = new Map<string, Map<string, number>>();

  for (const row of rows) {
    if (!countsByBarcode.has(row.barcode)) {
      countsByBarcode.set(row.barcode, new Map());
    }
    countsByBarcode.get(row.barcode)?.set(row.name, row.n_reads);
  }

  const barcodes: BarcodeCoverage[] = selected.flatMap((barcode) => {
    const sample = metadataByBarcode.get(barcode);
    if (sample === undefined) return [];
    const source = countsByBarcode.get(barcode);
    const counts = Object.fromEntries(
      names.map((name) => [name, source?.get(name) ?? 0]),
    );
    return [
      {
        ...sample,
        sampleId: sample.sampleId || barcode,
        counts,
        totalReads: Object.values(counts).reduce(
          (sum, value) => sum + value,
          0,
        ),
      },
    ];
  });

  const totals: AmpliconTotal[] = amplicons.map((amplicon) => ({
    ...amplicon,
    nReads: barcodes.reduce(
      (sum, barcode) => sum + barcode.counts[amplicon.name],
      0,
    ),
  }));

  return {
    amplicons,
    barcodes,
    totals,
    totalReads: totals.reduce((sum, row) => sum + row.nReads, 0),
  };
}
