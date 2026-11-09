import type { OverviewBarcode } from "./summarizeSequencingOverview";

export const SAMPLE_STATUSES = [
  "complete",
  "gathering",
  "noData",
  "unavailable",
] as const;
export type SampleChartStatus = (typeof SAMPLE_STATUSES)[number];

export function sampleVisualizationData(samples: OverviewBarcode[]) {
  const counts: Record<SampleChartStatus, number> = {
    complete: 0,
    gathering: 0,
    noData: 0,
    unavailable: 0,
  };
  for (const sample of samples) {
    if (
      sample.status === "complete" ||
      sample.status === "gathering" ||
      sample.status === "noData" ||
      sample.status === "unavailable"
    ) {
      counts[sample.status]++;
    } else {
      throw new Error(`Unexpected sample status: ${sample.status}`);
    }
  }
  return { counts };
}

export function controlVisualizationData(controls: OverviewBarcode[]) {
  const positives = controls.filter((item) => item.sampleType === "positive");
  const negatives = controls.filter((item) => item.sampleType === "negative");
  const passed = positives.filter((item) => item.status === "passed").length;
  const contaminated = negatives.filter(
    (item) => item.status === "contaminated",
  ).length;
  const negativePassed = negatives.filter(
    (item) => item.status === "passed",
  ).length;
  return {
    positiveTotal: positives.length,
    passed,
    allPositivePassed: positives.length > 0 && passed === positives.length,
    negativeTotal: negatives.length,
    negativePassed,
    contaminated,
  };
}
