import type {
  BarcodeMetadata,
  RegionCoverageRow,
} from "../../../../backend/contract";

export const OVERVIEW_THRESHOLDS = {
  sampleMeanCoverage: 100,
  sampleCoveredPercent: 95,
  noDataMeanCoverage: 5,
  sampleNoDataFraction: 0.8,
  negativeMeanCoverage: 50,
  positiveMeanCoverage: 100,
  positivePassedFraction: 0.8,
} as const;

export type SampleStatus = "complete" | "noData" | "gathering";
export type ControlStatus = "passed" | "contaminated" | "noData" | "gathering";
export type OverviewStatus = SampleStatus | ControlStatus | "unavailable";

export interface OverviewAmplicon {
  row: RegionCoverageRow;
  status: SampleStatus | "passed" | "contaminated" | "gathering";
}

export interface OverviewBarcode extends BarcodeMetadata {
  status: OverviewStatus;
  amplicons: OverviewAmplicon[];
  passedCount: number;
}

function sampleStatus(row: RegionCoverageRow): SampleStatus {
  if (
    row.mean_cov > OVERVIEW_THRESHOLDS.sampleMeanCoverage &&
    row.cov_gr100_per > OVERVIEW_THRESHOLDS.sampleCoveredPercent
  ) {
    return "complete";
  }
  return row.mean_cov < OVERVIEW_THRESHOLDS.noDataMeanCoverage
    ? "noData"
    : "gathering";
}

export function summarizeSequencingOverview(
  data: RegionCoverageRow[],
  metadata: BarcodeMetadata[],
  selected: string[],
): { samples: OverviewBarcode[]; controls: OverviewBarcode[] } {
  const rowsByBarcode = new Map<string, RegionCoverageRow[]>();
  for (const row of data) {
    if (row.barcode.trim().toLowerCase() === "unclassified") continue;
    const rows = rowsByBarcode.get(row.barcode) ?? [];
    rows.push(row);
    rowsByBarcode.set(row.barcode, rows);
  }
  const metadataByBarcode = new Map(
    metadata.map((item) => [item.barcode, item]),
  );
  const samples: OverviewBarcode[] = [];
  const controls: OverviewBarcode[] = [];

  for (const barcode of selected) {
    const item = metadataByBarcode.get(barcode);
    if (!item || barcode.trim().toLowerCase() === "unclassified") continue;
    const rows = rowsByBarcode.get(barcode) ?? [];
    const amplicons: OverviewAmplicon[] = rows.map((row) => ({
      row,
      status:
        item.sampleType === "sample"
          ? sampleStatus(row)
          : item.sampleType === "negative"
            ? row.mean_cov > OVERVIEW_THRESHOLDS.negativeMeanCoverage
              ? "contaminated"
              : "passed"
            : row.mean_cov > OVERVIEW_THRESHOLDS.positiveMeanCoverage
              ? "passed"
              : "gathering",
    }));
    const passedCount = amplicons.filter(
      (amplicon) => amplicon.status === "passed",
    ).length;
    let status: OverviewStatus;
    if (amplicons.length === 0) {
      status = "unavailable";
    } else if (item.sampleType === "sample") {
      status = amplicons.every((amplicon) => amplicon.status === "complete")
        ? "complete"
        : amplicons.filter((amplicon) => amplicon.status === "noData").length /
              amplicons.length >
            OVERVIEW_THRESHOLDS.sampleNoDataFraction
          ? "noData"
          : "gathering";
    } else if (item.sampleType === "negative") {
      status = amplicons.some((amplicon) => amplicon.status === "contaminated")
        ? "contaminated"
        : "passed";
    } else {
      status =
        passedCount / amplicons.length >
        OVERVIEW_THRESHOLDS.positivePassedFraction
          ? "passed"
          : rows.every(
                (row) => row.mean_cov < OVERVIEW_THRESHOLDS.noDataMeanCoverage,
              )
            ? "noData"
            : "gathering";
    }

    const result = {
      ...item,
      sampleId: item.sampleId || barcode,
      status,
      amplicons,
      passedCount,
    };
    (item.sampleType === "sample" ? samples : controls).push(result);
  }
  return { samples, controls };
}
